import type { Layer } from 'effect/Layer'

import type { RouteBuilder } from '@/framework/builder'
import type { LayoutDefinition } from '@/framework/route'

export interface Match {
  readonly entry: RouteBuilder.RouteEntry
  readonly params: Record<string, string>
  /** Outer-to-inner layout chain. */
  readonly layouts: readonly LayoutDefinition[]
  /** Outer-to-inner service scopes. */
  readonly layers: readonly Layer<any, any, any>[]
}

function compile(path: string) {
  const names: string[] = []

  const pattern = path
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith(':')) {
        names.push(segment.slice(1))
        return '([^/]+)'
      }
      if (segment === '*') {
        names.push('splat')
        return '(.*)'
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')

  return {
    regex: new RegExp(`^/${pattern}/?$`),
    names,
  }
}

function joinPath(prefix: string, path: string): string {
  if (path === '/') return prefix || '/'
  return `${prefix}${path}` || '/'
}

export function matchRoute(
  tree: RouteBuilder.RouteTree,
  pathname: string
): Match | undefined {
  return visit(tree, '', [], [], pathname)
}

function visit(
  tree: RouteBuilder.RouteTree,
  inheritedPrefix: string,
  inheritedLayouts: readonly LayoutDefinition[],
  inheritedLayers: readonly Layer<any, any, any>[],
  pathname: string
): Match | undefined {
  const prefix = `${inheritedPrefix}${tree.prefix}`
  const layouts = tree.layout
    ? [...inheritedLayouts, tree.layout]
    : inheritedLayouts
  const layers = tree.layer ? [...inheritedLayers, tree.layer] : inheritedLayers

  for (const entry of tree.routes) {
    const fullPath = joinPath(prefix, entry.path)
    const { regex, names } = compile(fullPath)
    const match = pathname.match(regex)
    if (!match) continue

    const params: Record<string, string> = {}
    names.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1] ?? '')
    })

    return { entry, params, layouts, layers }
  }

  for (const child of tree.children) {
    const match = visit(child, prefix, layouts, layers, pathname)
    if (match) return match
  }

  return undefined
}
