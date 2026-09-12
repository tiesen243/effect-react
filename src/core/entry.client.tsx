import {
  createFromReadableStream,
  createFromFetch,
  setServerCallback,
  createTemporaryReferenceSet,
  encodeReply,
} from '@vitejs/plugin-rsc/browser'
import * as React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { rscStream } from 'rsc-html-stream/client'

import type { RscPayload } from '@/core/entry.rsc'

import {
  RouterError,
  RouterProvider,
  consumePrefetch,
  prefetchUrl,
} from '@/core/react'
import { createRscRenderRequest } from '@/core/request'
import { ErrorBoundary } from '@/root'

async function main() {
  // stash `setPayload` function to trigger re-rendering
  // from outside of `BrowserRoot` component (e.g. server function call, navigation, hmr)
  let setPayload: (v: RscPayload) => void

  // deserialize RSC stream back to React VDOM for CSR
  const initialPayload = await createFromReadableStream<RscPayload>(
    // initial RSC stream is injected in SSR stream as <script>...FLIGHT_DATA...</script>
    rscStream
  )

  // browser root component to (re-)render RSC payload as state
  function BrowserRoot() {
    const [payload, setPayload_] = React.useState(initialPayload)

    React.useEffect(() => {
      setPayload = (v) => React.startTransition(() => setPayload_(v))
    }, [setPayload_])

    const loadRsc = React.useCallback(async (href: string) => {
      try {
        const prefetchedPayload = consumePrefetch<RscPayload>(href)
        if (prefetchedPayload) {
          const payload = await prefetchedPayload
          setPayload(payload)
          return
        }

        const renderRequest = createRscRenderRequest(href)
        const response = await fetch(renderRequest)

        if (!response.ok)
          return setPayload({
            root: null,
            error: {
              name: response.status === 404 ? 'NotFoundError' : 'RouterError',
              message:
                response.status === 404
                  ? `No route matches ${new URL(href).pathname}`
                  : `Navigation failed with HTTP ${response.status}`,
              status: response.status,
            },
          } as never)

        const payload = await createFromReadableStream<RscPayload>(
          response.body!
        )
        setPayload(payload)
      } catch (error) {
        setPayload({
          root: null,
          error: toErrorData(error),
        } as never)
      }
    }, [])

    const routerRuntime = React.useMemo(
      () => ({
        load: async (
          href: string,
          options: { replace: boolean; scroll: boolean }
        ) => {
          const current = new URL(window.location.href)
          const next = new URL(href)
          if (current.href === next.href) return

          if (options.replace) window.history.replaceState(null, '', next.href)
          else window.history.pushState(null, '', next.href)

          await loadRsc(next.href)
          if (options.scroll) window.scrollTo({ top: 0, behavior: 'auto' })
        },
        prefetch: (href: string) =>
          prefetchUrl(href, async (url) => {
            const renderRequest = createRscRenderRequest(url)
            const response = await fetch(renderRequest)

            if (!response.ok) {
              throw new RouterError({
                name: response.status === 404 ? 'NotFoundError' : 'RouterError',
                message:
                  response.status === 404
                    ? `No route matches ${new URL(url).pathname}`
                    : `Prefetch failed with HTTP ${response.status}`,
                status: response.status,
              })
            }

            return await createFromReadableStream<RscPayload>(response.body!)
          }),
      }),
      [loadRsc]
    )

    React.useEffect(() => {
      const onPopState = () => void loadRsc(window.location.href)
      window.addEventListener('popstate', onPopState)
      return () => window.removeEventListener('popstate', onPopState)
    }, [loadRsc])

    if ((payload as unknown as { error: Error }).error)
      throw new RouterError((payload as unknown as { error: Error }).error)

    return (
      <RouterProvider runtime={routerRuntime}>{payload.root}</RouterProvider>
    )
  }

  // register a handler which will be internally called by React
  // on server function request after hydration.
  setServerCallback(async (id, args) => {
    const temporaryReferences = createTemporaryReferenceSet()
    const renderRequest = createRscRenderRequest(window.location.href, {
      id,
      body: await encodeReply(args, { temporaryReferences }),
    })
    const payload = await createFromFetch<RscPayload>(fetch(renderRequest), {
      temporaryReferences,
    })
    setPayload(payload)
    const { ok, data } = payload.returnValue!
    if (!ok) throw data
    return data
  })

  // hydration
  const browserRoot = (
    <React.StrictMode>
      <ErrorBoundaryWrapper>
        <BrowserRoot />
      </ErrorBoundaryWrapper>
    </React.StrictMode>
  )

  if ('__NO_HYDRATE' in globalThis) createRoot(document).render(browserRoot)
  else
    hydrateRoot(document, browserRoot, {
      formState: initialPayload.formState,
    })

  // implement server HMR by triggering re-fetch/render of RSC upon server code change
  if (import.meta.hot) {
    import.meta.hot.on('rsc:update', () => {
      const renderRequest = createRscRenderRequest(window.location.href)
      void createFromFetch<RscPayload>(fetch(renderRequest)).then((payload) => {
        setPayload(payload)
      })
    })
  }
}

main()

class ErrorBoundaryWrapper extends React.Component<{
  readonly children: React.ReactNode
}> {
  override state: { readonly error?: unknown } = {}

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  override render() {
    if (this.state.error) {
      return (
        <ErrorBoundary
          error={toErrorData(this.state.error)}
          retry={() => window.location.reload()}
        />
      )
    }

    return this.props.children
  }
}

function toErrorData(error: unknown) {
  if (error instanceof RouterError) {
    return {
      name: error.name,
      message: error.message,
      status: error.status,
      stack: error.stack,
    }
  }
  if (error instanceof Error) {
    const status =
      typeof (error as Error & { status?: unknown }).status === 'number'
        ? (error as Error & { status: number }).status
        : undefined
    return {
      name: error.name,
      message: error.message,
      status,
      stack: error.stack,
    }
  }
  return { name: 'Error', message: String(error) }
}
