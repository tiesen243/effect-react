import type { ReactNode } from 'react'

import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { RouteBuilder } from '@/framework/builder'
import { matchRoute } from '@/framework/match'
import type {
  ErrorBoundaryContext,
  ErrorBoundaryError,
  LayoutDefinition,
  MetaDescriptor,
} from '@/framework/route'

export interface RenderResult {
  readonly meta: readonly MetaDescriptor[]
  readonly element: ReactNode
  readonly status: number
}

function toBoundaryError(error: unknown): ErrorBoundaryError {
  if (error && typeof error === 'object') {
    const value = error as Partial<ErrorBoundaryError>

    return {
      status: typeof value.status === 'number' ? value.status : 500,
      message:
        typeof value.message === 'string' ? value.message : String(error),
      stack: typeof value.stack === 'string' ? value.stack : undefined,
      cause: value.cause,
    }
  }

  return { status: 500, message: String(error) }
}

function getBoundary(
  layouts: readonly LayoutDefinition[]
): LayoutDefinition['errorBoundary'] | undefined {
  return [...layouts].reverse().find((layout) => layout.errorBoundary)
    ?.errorBoundary
}

function renderBoundary(
  boundary: LayoutDefinition['errorBoundary'],
  error: unknown
): Effect.Effect<ReactNode, unknown, never> {
  const value = toBoundaryError(error)

  if (!boundary) return Effect.fail(error)

  const context: ErrorBoundaryContext = {
    error: value,
    // A server render cannot synchronously retry the current request. The
    // client can re-request the current RSC tree when this callback is wired
    // to a client component.
    retry: () => undefined,
  }

  return boundary(context) as never
}

/**
 * Execute a matched route. Errors intentionally remain in Effect's error
 * channel. The request entrypoint decides whether to render a layout error
 * boundary or a generic fallback.
 */
export function runRoute(
  tree: RouteBuilder.RouteTree,
  request: Request
): Effect.Effect<RenderResult, unknown, never> {
  const url = new URL(request.url)
  const match = matchRoute(tree, url.pathname)

  if (!match)
    return Effect.fail({
      status: 404,
      message: `No route matched ${url.pathname}`,
    })

  const program = Effect.gen(function* () {
    const { entry, params: rawParams, layouts } = match
    const route = entry.route
    const params = route.params
      ? yield* Schema.decodeUnknownEffect(route.params)(rawParams)
      : rawParams

    const layoutData: unknown[] = []
    const meta: MetaDescriptor[] = []

    // Load layouts from outer -> inner so every child scope can depend on its
    // parent services/data without mutating the parent's loader data.
    for (const layout of layouts) {
      const data = layout.loader
        ? yield* layout.loader({ params: rawParams, request })
        : undefined

      layoutData.push(data)

      if (layout.meta)
        meta.push(...(yield* layout.meta({ loaderData: data })))
    }

    let loaderData: unknown = undefined
    let actionData: unknown = undefined

    if (request.method === 'GET' || request.method === 'HEAD') {
      if (route.loader)
        loaderData = yield* route.loader({ params, request } as never)
    } else if (route.action) {
      actionData = yield* route.action({ params, request } as never)
    }

    if (route.meta)
      meta.push(
        ...(yield* route.meta({ params, loaderData, actionData } as never))
      )

    let element = yield* route.component({
      params,
      loaderData,
      actionData,
    } as never)

    // Wrap inner -> outer. Each layout receives only its own loader data.
    for (let i = layouts.length - 1; i >= 0; i--) {
      const layout = layouts[i]!
      element = yield* layout.component({
        children: element,
        loaderData: layoutData[i] as never,
      })
    }

    return { status: 200, element, meta }
  })

  return match.layers.reduceRight(
    (effect, layer) => Effect.provide(effect, layer as never),
    program
  ) as unknown as Effect.Effect<RenderResult, unknown, never>
}

/**
 * Resolve a failed request against the nearest layout boundary.
 * Layout boundaries are searched from inner -> outer.
 */
export function renderRouteError(
  tree: RouteBuilder.RouteTree,
  request: Request,
  error: unknown
): Effect.Effect<RenderResult, unknown, never> {
  const pathname = new URL(request.url).pathname
  const match = matchRoute(tree, pathname)
  const boundary = match ? getBoundary(match.layouts) : tree.layout?.errorBoundary
  const value = toBoundaryError(error)

  if (!boundary) {
    return Effect.succeed({
      element: <div>Error: {value.message}</div>,
      meta: [],
      status: value.status,
    })
  }

  return renderBoundary(boundary, error).pipe(
    Effect.map((element) => ({
      element,
      meta: [],
      status: value.status,
    }))
  ) as never
}
