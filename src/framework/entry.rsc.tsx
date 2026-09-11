import { renderToReadableStream } from '@vitejs/plugin-rsc/rsc/server'
import * as Effect from 'effect/Effect'

import { loadRoutes } from '@/framework/routes'
import { renderRouteError, runRoute } from '@/framework/runtime'

export default async function handler(request: Request): Promise<Response> {
  const tree = await loadRoutes()
  const isRscRequest = new URL(request.url).pathname.endsWith('.rsc')

  // The browser asks for `/current-path.rsc` for the RSC payload, but route
  // matching must use the original pathname (`/`, `/todos`, ...).
  const routeRequest = isRscRequest
    ? new Request(
        new URL(request.url).toString().replace(/\.rsc(?=$|\?)/, ''),
        request
      )
    : request

  const result = await Effect.runPromise(
    runRoute(tree, routeRequest).pipe(
      Effect.catch((error) => renderRouteError(tree, routeRequest, error))
    )
  )

  if (isRscRequest)
    return new Response(renderToReadableStream(withMeta(result)), {
      status: result.status,
      headers: { 'Content-Type': 'text/x-component; charset=utf-8' },
    })

  const ssr = await import.meta.viteRsc.loadModule<
    typeof import('./entry.ssr.tsx')
  >('ssr', 'index')

  const htmlStream = await ssr.handleSsr(
    renderToReadableStream(withMeta(result))
  )

  return new Response(htmlStream, {
    status: result.status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function withMeta(props: {
  element: React.ReactNode
  meta: readonly import('@/framework/route').MetaDescriptor[]
}) {
  const { element, meta } = props

  const nodes = meta.map((descriptor, index) => {
    if (descriptor.title !== undefined)
      return <title key={`title-${index}`}>{descriptor.title}</title>

    if (descriptor.charSet !== undefined)
      return <meta key={`charset-${index}`} charSet={descriptor.charSet} />

    if (descriptor.name !== undefined)
      return (
        <meta
          key={`name-${index}`}
          name={descriptor.name}
          content={descriptor.content}
        />
      )

    if (descriptor.property !== undefined)
      return (
        <meta
          key={`property-${index}`}
          property={descriptor.property}
          content={descriptor.content}
        />
      )

    return null
  })

  return (
    <>
      {nodes}
      {element}
    </>
  )
}

if (import.meta.hot) {
  import.meta.hot.accept()
}
