import type { ReactFormState } from 'react-dom/client'

import {
  renderToReadableStream,
  createTemporaryReferenceSet,
  decodeReply,
  loadServerAction,
  decodeAction,
  decodeFormState,
} from '@vitejs/plugin-rsc/rsc/server'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { RouteEntry } from '@/core/route-builder'

import {
  isApiPath,
  parseRenderRequest,
  matchPath,
  selectRoute,
} from '@/core/request'
import { ErrorBoundary } from '@/root'

// The schema of payload which is serialized into RSC stream on rsc environment
// and deserialized on ssr/client environments.
export type RscPayload = {
  // this demo renders/serializes/deserializes the entire root HTML element
  // but this mechanism can be changed to render/fetch different parts of components
  // based on your own route conventions.
  root: React.ReactNode
  // server action return value of non-progressive enhancement case
  returnValue?: { ok: boolean; data: unknown }
  // server action form state (e.g. useActionState) of progressive enhancement case
  formState?: ReactFormState

  // error object to be serialized into RSC stream and deserialized on client
  error?: RscError
}

export type RscError = {
  name: string
  message: string
  status?: number
  stack?: string
}

// The plugin assumes by default that the `rsc` entry has a default export of a request handler.
// However, server entries can be executed differently by registering your own server handler.
export default { fetch: handler }

async function getRouteBuilder() {
  const routesModule = await import('@/routes')
  return routesModule.default
}

async function renderRoute(
  entries: readonly RouteEntry[],
  request: Request,
  url: URL,
  actionData: unknown = undefined
): Promise<React.ReactNode> {
  const entry = selectRoute(entries, url.pathname)
  if (!entry) return

  const { route, layer } = entry
  const match = matchPath(route.path, url.pathname)
  if (!match) return

  let params: unknown = match.params
  if (route.params) params = Schema.decodeUnknownSync(route.params)(params)

  const run = <A, E>(effect: Effect.Effect<A, E, any>) =>
    Effect.runPromise(
      effect.pipe(Effect.provide(layer)) as Effect.Effect<A, E, never>
    )

  const loaderData = route.loader
    ? await run(route.loader(params, request))
    : undefined
  if (!route.component) return loaderData

  const content = await run(route.component({ params, loaderData, actionData }))

  return entry.layouts.reduceRight<React.ReactNode>(
    (children, Layout) => <Layout>{children}</Layout>,
    content
  )
}

async function handleApiRequest(
  entries: readonly RouteEntry[],
  request: Request,
  url: URL
): Promise<Response> {
  const entry = selectRoute(entries, url.pathname)
  if (!entry) return Response.json({ error: 'Not Found' }, { status: 404 })

  const match = matchPath(entry.route.path, url.pathname)
  if (!match) return Response.json({ error: 'Not Found' }, { status: 404 })

  let params: unknown = match.params
  try {
    if (entry.route.params)
      params = Schema.decodeUnknownSync(entry.route.params)(match.params)
  } catch (error) {
    return Response.json(
      { error: 'Invalid route parameters', details: String(error) },
      { status: 400 }
    )
  }

  const method = request.method.toUpperCase()
  if (method !== 'GET' && method !== 'POST')
    return Response.json(
      { error: 'Method Not Allowed' },
      {
        status: 405,
        headers: { Allow: 'GET, POST' },
      }
    )

  const handler = method === 'GET' ? entry.route.loader : entry.route.action
  if (!handler)
    return Response.json(
      { error: 'Method Not Allowed' },
      {
        status: 405,
        headers: {
          Allow:
            entry.route.loader && entry.route.action
              ? 'GET, POST'
              : entry.route.loader
                ? 'GET'
                : 'POST',
        },
      }
    )

  try {
    const result = await Effect.runPromise(
      handler(params, request).pipe(
        Effect.provide(entry.layer)
      ) as Effect.Effect<unknown, unknown, never>
    )

    return Response.json(result)
  } catch (error) {
    const status =
      typeof (error as { status?: unknown })?.status === 'number'
        ? (error as { status: number }).status
        : 500

    return Response.json(
      {
        error: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'ApiError',
      },
      { status }
    )
  }
}

function getAllowedOrigin(
  request: Request,
  options: import('@/core/route-builder').CorsOptions | undefined
): string | undefined {
  const origin = request.headers.get('origin')
  if (!origin) return undefined

  const configured = options?.origin
  if (configured === undefined) return '*'

  if (configured === '*') return options?.credentials ? origin : '*'

  const origins = Array.isArray(configured) ? configured : [configured]
  return origins.includes(origin) ? origin : undefined
}

function withCors(
  request: Request,
  response: Response,
  options: import('@/core/route-builder').CorsOptions | undefined
): Response {
  if (!options) return response

  const origin = request.headers.get('origin')
  if (!origin) return response

  const allowedOrigin = getAllowedOrigin(request, options)
  if (!allowedOrigin) return response

  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', allowedOrigin)

  if (allowedOrigin !== '*') headers.append('Vary', 'Origin')

  if (options.credentials)
    headers.set('Access-Control-Allow-Credentials', 'true')

  if (options.exposedHeaders?.length)
    headers.set(
      'Access-Control-Expose-Headers',
      options.exposedHeaders.join(', ')
    )

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function handleCorsPreflight(
  request: Request,
  options: import('@/core/route-builder').CorsOptions | undefined
): Response | undefined {
  if (!options || request.method.toUpperCase() !== 'OPTIONS') return undefined
  if (!request.headers.has('origin')) return new Response(null, { status: 204 })

  const allowedOrigin = getAllowedOrigin(request, options)
  if (!allowedOrigin) {
    return new Response('Forbidden', { status: 403 })
  }

  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', allowedOrigin)

  if (allowedOrigin !== '*') headers.append('Vary', 'Origin')

  headers.set(
    'Access-Control-Allow-Methods',
    options.methods?.join(', ') ?? 'GET, POST, OPTIONS'
  )

  const requestedHeaders = request.headers.get('Access-Control-Request-Headers')
  if (options.allowedHeaders?.length)
    headers.set(
      'Access-Control-Allow-Headers',
      options.allowedHeaders.join(', ')
    )
  else if (requestedHeaders)
    headers.set('Access-Control-Allow-Headers', requestedHeaders)

  if (options.credentials)
    headers.set('Access-Control-Allow-Credentials', 'true')

  if (options.maxAge !== undefined)
    headers.set('Access-Control-Max-Age', String(options.maxAge))

  return new Response(null, { status: 204, headers })
}

async function handler(request: Request): Promise<Response> {
  const routeBuilder = await getRouteBuilder()
  const corsOptions = routeBuilder._cors

  const preflight = handleCorsPreflight(request, corsOptions)
  if (preflight) return preflight

  // differentiate RSC, SSR, action, etc.
  const renderRequest = parseRenderRequest(request)
  request = renderRequest.request

  const entries = routeBuilder._entries

  const respond = (response: Response) =>
    withCors(renderRequest.request, response, corsOptions)

  if (!renderRequest.isRsc && isApiPath(renderRequest.url.pathname))
    return respond(
      await handleApiRequest(entries, renderRequest.request, renderRequest.url)
    )

  // handle server function request
  let returnValue: RscPayload['returnValue'] | undefined
  let formState: ReactFormState | undefined
  let temporaryReferences: unknown | undefined
  let actionStatus: number | undefined
  let routeActionData: unknown = undefined

  if (
    renderRequest.isAction &&
    !renderRequest.isRsc &&
    !renderRequest.actionId
  ) {
    const entry = selectRoute(entries, renderRequest.url.pathname)
    if (!entry || !entry.route.action)
      return respond(new Response('Method Not Allowed', { status: 405 }))

    const match = matchPath(entry.route.path, renderRequest.url.pathname)
    if (!match) return respond(new Response('Not Found', { status: 404 }))

    const params = entry.route.params
      ? Schema.decodeUnknownSync(entry.route.params)(match.params)
      : match.params
    const action = entry.route.action(params, renderRequest.request.clone())
    routeActionData = await Effect.runPromise(
      action.pipe(Effect.provide(entry.layer)) as Effect.Effect<
        unknown,
        unknown,
        never
      >
    )
  } else if (renderRequest.isAction) {
    if (renderRequest.actionId) {
      const contentType = request.headers.get('content-type')
      const body = contentType?.startsWith('multipart/form-data')
        ? await request.formData()
        : await request.text()
      temporaryReferences = createTemporaryReferenceSet()
      const args = await decodeReply(body, { temporaryReferences })
      const action = await loadServerAction(renderRequest.actionId)
      try {
        const data = await action.apply(null, args)
        returnValue = { ok: true, data }
      } catch (e) {
        returnValue = { ok: false, data: e }
        actionStatus = 500
      }
    } else {
      const formData = await request.formData()
      const decodedAction = await decodeAction(formData)
      try {
        const result = await decodedAction()
        formState = await decodeFormState(result, formData)
      } catch {
        return respond(
          new Response('Internal Server Error: server action failed', {
            status: 500,
          })
        )
      }
    }
  }

  const entry = selectRoute(entries, renderRequest.url.pathname)

  let root: React.ReactNode
  let status: number | undefined

  let payloadError: RscError | undefined

  if (!entry) {
    payloadError = {
      name: 'NotFoundError',
      message: `No route matches ${renderRequest.url.pathname}`,
      status: 404,
    }

    // Keep a server-renderable fallback in the RSC tree. On the client the
    // payload error is promoted to RouterError and enters the error boundary.
    root = <ErrorBoundary error={payloadError} />
    status = 404
  } else {
    root =
      (await renderRoute(
        entries,
        renderRequest.request,
        renderRequest.url,
        routeActionData
      )) ?? null
  }

  const rscPayload: RscPayload = {
    root,
    error: payloadError,
    formState,
    returnValue,
  }
  const rscOptions = { temporaryReferences }
  const rscStream = renderToReadableStream<RscPayload>(rscPayload, rscOptions)

  if (renderRequest.isRsc) {
    return respond(
      new Response(rscStream, {
        status: status ?? actionStatus,
        headers: { 'content-type': 'text/x-component;charset=utf-8' },
      })
    )
  }

  const ssrEntryModule = await import.meta.viteRsc.loadModule<
    typeof import('@/core/entry.ssr')
  >('ssr', 'index')
  const ssrResult = await ssrEntryModule.renderHTML(rscStream, {
    formState,
    debugNojs: renderRequest.url.searchParams.has('__nojs'),
  })

  return respond(
    new Response(ssrResult.stream, {
      status: status ?? ssrResult.status,
      headers: { 'Content-type': 'text/html' },
    })
  )
}

if (import.meta.hot) {
  import.meta.hot.accept()
}
