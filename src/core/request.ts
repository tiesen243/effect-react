// Framework conventions (arbitrary choices for this demo):
// - Use `_.rsc` URL suffix to differentiate RSC requests from SSR requests

import type { RouteEntry } from '@/core/route-builder'

// - Use `x-rsc-action` header to pass server action ID
const URL_POSTFIX = '_.rsc'
const HEADER_ACTION_ID = 'x-rsc-action'

// Parsed request information used to route between RSC/SSR rendering and action handling.
// Created by parseRenderRequest() from incoming HTTP requests.
type RenderRequest = {
  isRsc: boolean // true if request should return RSC payload (via _.rsc suffix)
  isAction: boolean // true if this is a server action call (POST request)
  actionId?: string // server action ID from x-rsc-action header
  request: Request // normalized Request with _.rsc suffix removed from URL
  url: URL // normalized URL with _.rsc suffix removed
}

export function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/')
}

export type RouteMatch = {
  readonly params: Record<string, string>
  readonly pathname: string
}

export function createRscRenderRequest(
  urlString: string,
  action?: { id: string; body: BodyInit }
): Request {
  const url = new URL(urlString)
  url.pathname += URL_POSTFIX
  const headers = new Headers()
  if (action) {
    headers.set(HEADER_ACTION_ID, action.id)
  }
  return new Request(url.toString(), {
    method: action ? 'POST' : 'GET',
    headers,
    body: action?.body,
  })
}

export function parseRenderRequest(request: Request): RenderRequest {
  const url = new URL(request.url)
  const isAction = request.method === 'POST'
  if (url.pathname.endsWith(URL_POSTFIX)) {
    url.pathname = url.pathname.slice(0, -URL_POSTFIX.length)
    const actionId = request.headers.get(HEADER_ACTION_ID) || undefined
    if (request.method === 'POST' && !actionId) {
      throw new Error('Missing action id header for RSC action request')
    }
    return {
      isRsc: true,
      isAction,
      actionId,
      request: new Request(url, request),
      url,
    }
  } else {
    return {
      isRsc: false,
      isAction,
      request,
      url,
    }
  }
}

export function matchPath(
  pattern: string,
  pathname: string
): RouteMatch | undefined {
  const normalizedPattern = normalizePath(pattern)
  const normalizedPath = normalizePath(pathname)
  const patternParts =
    normalizedPattern === '/' ? [] : normalizedPattern.slice(1).split('/')
  const pathParts =
    normalizedPath === '/' ? [] : normalizedPath.slice(1).split('/')

  const params: Record<string, string> = {}
  let i = 0
  let j = 0

  while (i < patternParts.length) {
    const part = patternParts[i]
    if (part === undefined) return undefined

    if (part.startsWith('*')) {
      params[part.slice(1) || 'splat'] = pathParts
        .slice(j)
        .map(decodeSegment)
        .join('/')
      j = pathParts.length
      i = patternParts.length
      break
    }

    const value = pathParts[j]
    if (value === undefined) return undefined

    if (part.startsWith(':')) {
      params[part.slice(1)] = decodeSegment(value)
    } else if (part !== value) {
      return undefined
    }

    i++
    j++
  }

  return j === pathParts.length && i === patternParts.length
    ? { params, pathname: normalizedPath }
    : undefined
}

function normalizePath(pathname: string): string {
  if (pathname === '/') return '/'
  return `/${pathname.replace(/^\/+|\/+$/g, '')}`
}

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function scorePath(path: string): number {
  return (
    path.split('/').reduce((score, part) => {
      if (!part) return score
      if (part.startsWith('*')) return score + 1
      if (part.startsWith(':')) return score + 5
      return score + 10
    }, 0) -
    (path.match(/\*/g)?.length ?? 0) * 100
  )
}

export function selectRoute(
  entries: readonly RouteEntry[],
  pathname: string
): RouteEntry | undefined {
  return entries
    .filter((entry) => matchPath(entry.route.path, pathname))
    .sort((a, b) => scorePath(b.route.path) - scorePath(a.route.path))[0]
}
