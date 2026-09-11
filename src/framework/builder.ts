import type { Layer } from 'effect/Layer'

import type { LayoutDefinition, RouteDefinition } from '@/framework/route'

export class RouteBuilder<
  T extends RouteBuilder.RouteTree = RouteBuilder.RouteTree,
> {
  private constructor(readonly tree: T) {}

  public static get empty() {
    return new RouteBuilder({ routes: [], children: [], prefix: '' })
  }

  layout(layout: LayoutDefinition | LayoutDefinition['component']) {
    const value = typeof layout === 'function' ? { component: layout } : layout
    this.tree.layout = value
    return this
  }

  add<const P extends string, Pm, L, A>(
    path: P,
    route: RouteDefinition<Pm, L, A>
  ) {
    const normalized = this._normalizePath(path)
    this.tree.routes = [
      ...this.tree.routes,
      { path: normalized, route: route as never },
    ]
    return this
  }

  /**
   * Merge another builder as a child scope.
   *
   * Example:
   *
   * root.merge(
   *   RouteBuilder.layout(DashboardLayout).add('/dashboard', DashboardRoute),
   * )
   *
   * produces RootLayout -> DashboardLayout -> DashboardRoute.
   */
  merge<U extends RouteBuilder.RouteTree>(other: RouteBuilder<U>) {
    this.tree.children = [...this.tree.children, other.tree]
    return this
  }

  /**
   * Prefix every route in this scope, including all merged child scopes.
   * Every `add()` path itself must still start with `/`.
   */
  prefix(prefix: string) {
    this.tree.prefix = this._joinPrefix(
      this.tree.prefix,
      this._normalizePrefix(prefix)
    )

    return this
  }

  /**
   * Provide services to this scope and its descendants only.
   * Sibling builders do not receive this layer.
   */
  provide(layer: Layer<any, any, any>) {
    this.tree.layer = layer
    return this
  }

  make(): T {
    return this.tree
  }

  private _joinPrefix(parent: string, child: string): string {
    if (!parent) return child
    if (!child) return parent
    return `${parent}${child}`
  }

  private _normalizePrefix(prefix: string): string {
    if (!prefix || prefix === '/') return ''
    return prefix.replace(/\/$/, '')
  }

  private _normalizePath(path: string): string {
    if (path !== '/' && path.endsWith('/')) return path.slice(0, -1)
    return path
  }
}

export namespace RouteBuilder {
  export interface RouteEntry<
    P = Record<string, string>,
    L = unknown,
    A = unknown,
  > {
    readonly path: string
    readonly route: RouteDefinition<P, L, A>
  }

  export interface RouteTree {
    layout?: LayoutDefinition
    routes: readonly RouteEntry[]
    children: readonly RouteTree[]
    prefix: string
    layer?: Layer<any, any, any>
  }
}
