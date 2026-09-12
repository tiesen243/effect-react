import type { PathInput } from 'effect/unstable/http/HttpRouter'

import * as Layer from 'effect/Layer'

import type { AnyRoute, RouteRequirements } from '@/core/route'

type AnyLayer = Layer.Layer<any, any, any>

export type Layout = (props: { children: React.ReactNode }) => React.ReactNode

export type RouteEntry<TRoute extends AnyRoute = AnyRoute> = {
  readonly route: TRoute
  readonly layer: AnyLayer
  readonly layouts: readonly Layout[]
  readonly scope: symbol
}

type LayerOutput<L> = L extends Layer.Layer<infer A, any, any> ? A : never
type LayerRequirements<L> = L extends Layer.Layer<any, any, infer R> ? R : never

type BuilderRequirement<Routes, L> =
  | Exclude<
      Routes extends AnyRoute ? RouteRequirements<Routes> : never,
      LayerOutput<L>
    >
  | LayerRequirements<L>

export class RouteBuilder<
  TRoutes extends readonly AnyRoute[] = [],
  TLayer extends AnyLayer = AnyLayer,
  TLayouts extends readonly Layout[] = [],
  TRequires = BuilderRequirement<TRoutes[number], TLayer>,
> {
  private constructor(
    private readonly routes: readonly AnyRoute[],
    private readonly layer: AnyLayer,
    private readonly layouts: readonly Layout[],
    private readonly prefixValue: string,
    private readonly entries: readonly RouteEntry[],
    private readonly scope: symbol = Symbol('RouteBuilderScope')
  ) {}

  public static get empty(): RouteBuilder {
    return new RouteBuilder([], Layer.empty as never, [], '', [])
  }

  public layout(
    layout: Layout
  ): RouteBuilder<TRoutes, TLayer, [...TLayouts, Layout], TRequires> {
    return new RouteBuilder(
      this.routes,
      this.layer,
      [...this.layouts, layout],
      this.prefixValue,
      this.entries,
      this.scope
    )
  }

  public add<TRoute extends AnyRoute>(
    route: TRoute
  ): RouteBuilder<
    [...TRoutes, TRoute],
    TLayer,
    TLayouts,
    BuilderRequirement<[...TRoutes, TRoute][number], TLayer>
  > {
    const normalized = {
      ...route,
      path: this.joinPaths(this.prefixValue, route.path),
    } as TRoute

    return new RouteBuilder(
      [...this.routes, normalized],
      this.layer,
      this.layouts,
      this.prefixValue,
      [
        ...this.entries,
        this.createEntry(normalized, this.layer, this.layouts, this.scope),
      ],
      this.scope
    )
  }

  public prefix<TPrefix extends `/${string}`>(
    prefix: TPrefix
  ): RouteBuilder<
    TRoutes,
    TLayer,
    TLayouts,
    BuilderRequirement<TRoutes[number], TLayer>
  > {
    const nextPrefix = this.joinPaths(this.prefixValue, prefix)
    const routes = this.routes.map((route) => ({
      ...route,
      path: this.joinPaths(prefix, route.path),
    }))
    const entries = this.entries.map((entry) => ({
      ...entry,
      route: { ...entry.route, path: this.joinPaths(prefix, entry.route.path) },
    }))

    return new RouteBuilder(
      routes,
      this.layer,
      this.layouts,
      nextPrefix,
      entries,
      this.scope
    )
  }

  public provide<Out, Err, In>(
    layer: Layer.Layer<Out, Err, In>
  ): RouteBuilder<
    TRoutes,
    Layer.Layer<LayerOutput<TLayer> | Out, any, LayerRequirements<TLayer> | In>,
    TLayouts,
    Exclude<BuilderRequirement<TRoutes[number], TLayer>, Out> | In
  > {
    const nextLayer = Layer.merge(this.layer, layer)

    // `provide` is lexical: this builder's layer is inherited by every
    // route currently inside the builder, including routes merged from
    // child builders. New routes added afterwards use `nextLayer` too.
    return new RouteBuilder(
      this.routes,
      nextLayer,
      this.layouts,
      this.prefixValue,
      this.entries.map((entry) => ({
        ...entry,
        layer: Layer.merge(entry.layer, layer),
      })),
      this.scope
    )
  }

  public merge<
    OTRoutes extends readonly AnyRoute[],
    OTLayer extends AnyLayer,
    OTLayouts extends readonly Layout[],
    OTRequires,
  >(
    child: RouteBuilder<OTRoutes, OTLayer, OTLayouts, OTRequires>
  ): RouteBuilder<
    [...TRoutes, ...OTRoutes],
    TLayer,
    TLayouts,
    BuilderRequirement<TRoutes[number], TLayer> | OTRequires
  > {
    const childEntries = child._entries.map((entry) => ({
      ...entry,
      layer: Layer.merge(this.layer, entry.layer),
      layouts: [...this.layouts, ...entry.layouts],
    }))

    return new RouteBuilder(
      [...this.routes, ...child._routes],
      this.layer,
      this.layouts,
      this.prefixValue,
      [...this.entries, ...childEntries],
      this.scope
    )
  }

  public get _routes(): readonly AnyRoute[] {
    return this.routes
  }

  public get _entries(): readonly RouteEntry<TRoutes[number]>[] {
    return this.entries as readonly RouteEntry<TRoutes[number]>[]
  }

  private createEntry(
    route: AnyRoute,
    layer: AnyLayer,
    layouts: readonly Layout[],
    scope: symbol
  ): RouteEntry {
    return { route, layer, layouts, scope }
  }

  private joinPaths(left: string, right: string): PathInput {
    const path = `${left}/${right}`.replace(/\/+/g, '/')
    if (path === '/') return '/'
    return `/${path.replace(/^\/+/, '').replace(/\/+$/, '')}`
  }
}
