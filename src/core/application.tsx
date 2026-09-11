import type { JSX } from 'react/jsx-runtime'

import * as Effect from 'effect/Effect'

import type { Route } from '@/core/route'

type RouteItem = {
  path: string
  regex: RegExp
  paramNames: string[]
  route: Route
}

export class Application {
  private _layout: (props: { children: React.ReactNode }) => JSX.Element
  private _routes: RouteItem[] = []

  private constructor(
    layout: (props: { children: React.ReactNode }) => JSX.Element
  ) {
    this._layout = layout
  }

  public static get empty() {
    return new Application(({ children }) => <>{children}</>)
  }

  public layout(layout: (props: { children: React.ReactNode }) => JSX.Element) {
    this._layout = layout
    return this
  }

  public add(path: string, routeConfig: Route) {
    const paramNames: string[] = []

    // 1. Chuyển path pattern thành Regular Expression
    // - Catch-all: `/*` -> matching mọi đoạn path còn lại
    // - Dynamic param: `:id` -> matching 1 đoạn path
    let regexPath = path
      .replace(/\/\*/g, '(?<catchAll>\\/.*)?') // Catch-all wildcard
      .replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
        paramNames.push(key)
        return '([^/]+)' // Match param value
      })

    // Match exact path
    const regex = new RegExp(`^${regexPath}$`)

    this._routes.push({
      path,
      regex,
      paramNames,
      route: routeConfig,
    })

    return this
  }

  public matchAndRender(url: URL) {
    const layout = this._layout
    const pathname = url.pathname

    // Find route khớp với URL
    let matchedParams: Record<string, any> = {}
    let matchedRoute: Route | null = null

    for (const item of this._routes) {
      const match = pathname.match(item.regex)
      if (match) {
        matchedRoute = item.route

        // Parse dynamic params (:id, :slug)
        item.paramNames.forEach((name, index) => {
          matchedParams[name] = match[index + 1]
        })

        // Parse catch-all route (*)
        if (match.groups?.catchAll) {
          // Bỏ dấu '/' ở đầu nếu có và tách mảng
          const catchAllPath = match.groups.catchAll.replace(/^\//, '')
          matchedParams['*'] = catchAllPath.split('/')
        }

        break
      }
    }

    return Effect.gen(function* () {
      if (!matchedRoute || !matchedRoute.options.component) {
        return layout({ children: <h1>404 - Page Not Found</h1> })
      }

      // Truyền params đã parse được vào Effect component của Route
      const pageJsx = yield* matchedRoute.options.component(matchedParams)
      return layout({ children: pageJsx })
    })
  }
}
