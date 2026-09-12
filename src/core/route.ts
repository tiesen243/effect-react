import type { Layer } from 'effect/Layer'

import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import * as HttpRouter from 'effect/unstable/http/HttpRouter'

export const Route = Symbol.for('effect/Route')

type AnySchema = Schema.Constraint

type ParamsOf<S extends AnySchema | undefined> = S extends AnySchema
  ? S['Type']
  : Record<string, never>

export type Route<
  TParams extends AnySchema | undefined = undefined,
  TLoader = undefined,
  TAction = undefined,
  TError = never,
  TLoaderRequires = never,
  TActionRequires = never,
  TComponentRequires = never,
> = {
  readonly [Route]: typeof Route

  readonly path: HttpRouter.PathInput
  readonly params?: TParams

  readonly loader?: (
    params: ParamsOf<TParams>,
    request: Request
  ) => Effect.Effect<TLoader, TError, TLoaderRequires>

  readonly action?: (
    params: ParamsOf<TParams>,
    request: Request
  ) => Effect.Effect<TAction, TError, TActionRequires>

  readonly component?: (props: {
    params: ParamsOf<TParams>
    loaderData: TLoader
    actionData: TAction
  }) => Effect.Effect<React.ReactNode, TError, TComponentRequires>
}

export type AnyRoute = Route<any, any, any, any, any, any, any>

export type RouteRequirements<R extends AnyRoute> =
  R extends Route<any, any, any, any, infer L, infer A, infer C>
    ? L | A | C
    : never

export type RouteLoader<R extends AnyRoute> =
  R extends Route<any, infer A, any, any, any, any, any> ? A : never

export type RouteAction<R extends AnyRoute> =
  R extends Route<any, any, infer A, any, any, any, any> ? A : never

export type RouteError<R extends AnyRoute> =
  R extends Route<any, any, any, infer E, any, any, any> ? E : never

export type RouteParams<R extends AnyRoute> =
  R extends Route<infer S, any, any, any, any, any, any> ? ParamsOf<S> : never

export function isRoute(value: unknown): value is Route {
  return typeof value === 'object' && value !== null && Route in value
}

export function createRoute<
  TParams extends AnySchema | undefined = undefined,
  TLoader = undefined,
  TAction = undefined,
  TError = never,
  TLoaderRequires = never,
  TActionRequires = never,
  TComponentRequires = never,
>(
  options: Omit<
    Route<
      TParams,
      TLoader,
      TAction,
      TError,
      TLoaderRequires,
      TActionRequires,
      TComponentRequires
    >,
    typeof Route
  >
): Route<
  TParams,
  TLoader,
  TAction,
  TError,
  TLoaderRequires,
  TActionRequires,
  TComponentRequires
> {
  return { ...options, [Route]: Route }
}

export type RouteLayer = Layer<any, any, any>
