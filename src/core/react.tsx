'use client'

import React from 'react'

import type { RscPayload } from '@/core/entry.rsc'

export type RouterErrorData = {
  readonly name?: string
  readonly message: string
  readonly status?: number
  readonly stack?: string
}

export class RouterError extends Error {
  readonly status?: number

  constructor(data: RouterErrorData) {
    super(data.message)
    this.name = data.name ?? 'RouterError'
    this.status = data.status
    this.stack = data.stack ?? this.stack
  }
}

export type NavigateOptions = {
  readonly replace?: boolean
  readonly scroll?: boolean
}

export type Router = {
  readonly push: (
    href: string,
    options?: Omit<NavigateOptions, 'replace'>
  ) => void
  readonly replace: (
    href: string,
    options?: Omit<NavigateOptions, 'replace'>
  ) => void
  readonly back: () => void
  readonly forward: () => void
  readonly go: (delta: number) => void
  readonly prefetch: (href: string) => Promise<RscPayload>
}

export type RouterRuntime = {
  readonly load: (
    url: string,
    options: { readonly replace: boolean; readonly scroll: boolean }
  ) => Promise<void>
  readonly prefetch: (url: string) => Promise<RscPayload>
}

export const RouterContext = React.createContext<Router | null>(null)

const prefetched = new Map<string, Promise<unknown>>()

export function RouterProvider({
  children,
  runtime,
}: {
  readonly children: React.ReactNode
  readonly runtime: RouterRuntime
}) {
  const runtimeRef = React.useRef(runtime)
  // oxlint-disable-next-line react/refs
  runtimeRef.current = runtime

  const memoizedValue = React.useMemo<Router>(() => {
    const navigate = (href: string, options: NavigateOptions = {}) => {
      const url = resolveUrl(href)
      if (!url)
        throw new Error('Router navigation is only available in the browser.')

      void runtimeRef.current.load(url.toString(), {
        replace: options.replace ?? false,
        scroll: options.scroll ?? true,
      })
    }

    return {
      push: (href, options) => navigate(href, options),
      replace: (href, options) => navigate(href, { ...options, replace: true }),
      back: () => window.history.back(),
      forward: () => window.history.forward(),
      go: (delta) => window.history.go(delta),
      prefetch: (href) => {
        const url = resolveUrl(href)
        if (!url)
          return Promise.reject(
            new Error('Router prefetch is only available in the browser.')
          )

        return runtimeRef.current.prefetch(url.toString())
      },
    }
  }, [])

  return <RouterContext value={memoizedValue}>{children}</RouterContext>
}

export function useRouter(): Router {
  const router = React.use(RouterContext)
  if (!router)
    throw new Error('useRouter() must be used inside <RouterProvider>.')
  return router
}

export type LinkProps = Omit<React.ComponentProps<'a'>, 'href' | 'onClick'> & {
  readonly href: string
  readonly replace?: boolean
  readonly prefetch?: boolean
  readonly scroll?: boolean
  readonly onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

export function Link({
  href,
  replace = false,
  prefetch = true,
  scroll = true,
  onMouseEnter,
  onFocus,
  onClick,
  ...props
}: LinkProps) {
  const router = React.use(RouterContext)

  const prefetchRoute = React.useCallback(() => {
    const url = resolveUrl(href)
    if (prefetch && url && url.origin === window.location.origin) {
      if (router) void router.prefetch(url.toString())
    }
  }, [href, prefetch, router])

  return (
    <a
      data-slot='link'
      href={href}

      onMouseEnter={(event) => {
        onMouseEnter?.(event)
        if (!event.defaultPrevented) prefetchRoute()
      }}

      onFocus={(event) => {
        onFocus?.(event)
        if (!event.defaultPrevented) prefetchRoute()
      }}

      onClick={(event) => {
        onClick?.(event)
        if (!router) return

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (props.target && props.target !== '_self') ||
          props.download
        )
          return

        const url = resolveUrl(href)
        if (!url || url.origin !== window.location.origin) return

        event.preventDefault()
        if (router) {
          if (replace) router.replace(url.toString(), { scroll })
          else router.push(url.toString(), { scroll })
        }
      }}

      aria-current={props['aria-current']}
      aria-label={props['aria-label'] ?? `Navigate to ${href}`}
      {...props}
    />
  )
}

export function prefetchUrl<T>(
  url: string,
  fetchPayload: (url: string) => Promise<T>
): Promise<T> {
  const existing = prefetched.get(url)
  if (existing) return existing as Promise<T>

  const request = fetchPayload(url).catch((error) => {
    prefetched.delete(url)
    throw error
  })
  prefetched.set(url, request)
  return request
}

export function consumePrefetch<T = unknown>(
  url: string
): Promise<T> | undefined {
  const request = prefetched.get(url)
  prefetched.delete(url)
  return request as Promise<T> | undefined
}

function resolveUrl(href: string): URL | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return new URL(href, window.location.href)
  } catch {
    return undefined
  }
}
