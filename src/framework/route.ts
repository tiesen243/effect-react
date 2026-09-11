import type { ReactNode } from 'react'

import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

export type ParamsSchema = Schema.Constraint

export type ParamsOf<S extends ParamsSchema | undefined> =
  S extends ParamsSchema ? Schema.Schema.Type<S> : Record<string, string>

type EffectValue<T> = T extends Effect.Effect<infer A, any, any> ? A : never

type LoaderFn<P, L = unknown> = (
  context: LoaderContext<P>
) => Effect.Effect<L, any, any>

type ActionFn<P, A = unknown> = (
  context: ActionContext<P>
) => Effect.Effect<A, any, any>

type LoaderResult<F> = F extends (context: any) => infer E
  ? EffectValue<E>
  : undefined

type ActionResult<F> = F extends (context: any) => infer E
  ? EffectValue<E>
  : undefined

export interface MetaDescriptor {
  readonly title?: string
  readonly name?: string
  readonly content?: string
  readonly property?: string
  readonly charSet?: string
}

export interface LoaderContext<P> {
  readonly params: P
  readonly request: Request
}

export interface ActionContext<P> {
  readonly params: P
  readonly request: Request
}

export interface MetaContext<P, L, A> {
  readonly params: P
  readonly loaderData: L
  readonly actionData: A
}

export interface ComponentContext<P, L, A> {
  readonly params: P
  readonly loaderData: L
  readonly actionData: A
}

export interface ErrorBoundaryContext {
  readonly error: ErrorBoundaryError
  readonly retry: () => void
}

export interface ErrorBoundaryError {
  readonly status: number
  readonly message: string
  readonly stack?: string
  readonly cause?: unknown
}

export interface RouteDefinition<
  P = Record<string, string>,
  L = undefined,
  A = undefined,
> {
  readonly params?: ParamsSchema
  readonly loader?: (context: LoaderContext<P>) => Effect.Effect<L, any, any>
  readonly action?: (context: ActionContext<P>) => Effect.Effect<A, any, any>
  readonly meta?: (
    context: MetaContext<P, L, A>
  ) => Effect.Effect<readonly MetaDescriptor[], any, any>
  readonly component: (
    context: ComponentContext<P, L, A>
  ) => Effect.Effect<ReactNode, any, any>
}

export const Route = {
  make<
    S extends ParamsSchema | undefined,
    LF extends LoaderFn<ParamsOf<S>> | undefined,
    AF extends ActionFn<ParamsOf<S>> | undefined,
  >(definition: {
    readonly params?: S
    readonly loader?: LF
    readonly action?: AF

    readonly meta?: (
      context: MetaContext<ParamsOf<S>, LoaderResult<LF>, ActionResult<AF>>
    ) => Effect.Effect<readonly MetaDescriptor[], any, any>

    readonly component: (
      context: ComponentContext<ParamsOf<S>, LoaderResult<LF>, ActionResult<AF>>
    ) => Effect.Effect<ReactNode, any, any>
  }): RouteDefinition<ParamsOf<S>, LoaderResult<LF>, ActionResult<AF>> {
    return definition as never
  },
}

export interface LayoutLoaderContext {
  readonly params: Record<string, string>
  readonly request: Request
}

export interface LayoutMetaContext<L> {
  readonly loaderData: L
}

export interface LayoutComponentContext<L> {
  readonly children: ReactNode
  readonly loaderData: L
}

export interface LayoutDefinition<L = undefined> {
  readonly loader?: (context: LayoutLoaderContext) => Effect.Effect<L, any, any>
  readonly meta?: (
    context: LayoutMetaContext<L>
  ) => Effect.Effect<readonly MetaDescriptor[], any, any>
  readonly component: (
    context: LayoutComponentContext<L>
  ) => Effect.Effect<ReactNode, any, any>
  readonly errorBoundary?: (
    context: ErrorBoundaryContext
  ) => Effect.Effect<ReactNode, any, any>
}

export const Layout = {
  make<L = undefined>(definition: {
    readonly loader?: (
      context: LayoutLoaderContext
    ) => Effect.Effect<L, any, any>
    readonly meta?: (
      context: LayoutMetaContext<L>
    ) => Effect.Effect<readonly MetaDescriptor[], any, any>
    readonly component: (
      context: LayoutComponentContext<L>
    ) => Effect.Effect<ReactNode, any, any>
    readonly errorBoundary?: (
      context: ErrorBoundaryContext
    ) => Effect.Effect<ReactNode, any, any>
  }): LayoutDefinition<L> {
    return definition
  },
}
