import type { ReactFormState } from 'react-dom/client'
import type { JSX } from 'react/jsx-runtime'

import {
  renderToReadableStream,
  createTemporaryReferenceSet,
  decodeReply,
  loadServerAction,
  decodeAction,
  decodeFormState,
} from '@vitejs/plugin-rsc/rsc/server'
import * as Effect from 'effect/Effect'

import { parseRenderRequest } from '@/core/request'
import { Root } from '@/root.tsx'
import routes from '@/routes'

export type RscPayload = {
  root: React.ReactNode
  returnValue?: { ok: boolean; data: unknown }
  formState?: ReactFormState
}

export default { fetch: handler }

async function handler(request: Request): Promise<Response> {
  const renderRequest = parseRenderRequest(request)
  request = renderRequest.request

  let returnValue: RscPayload['returnValue'] | undefined
  let formState: ReactFormState | undefined
  let temporaryReferences: unknown | undefined
  let actionStatus: number | undefined

  if (renderRequest.isAction) {
    if (renderRequest.actionId) {
      const contentType = request.headers.get('content-type')
      const body = contentType?.startsWith('multipart/form-data')
        ? await request.formData()
        : await request.text()
      temporaryReferences = createTemporaryReferenceSet()
      const args = await decodeReply(body, { temporaryReferences })
      const action = await loadServerAction(renderRequest.actionId)
      try {
        const data = await action.apply(null, args)
        returnValue = { ok: true, data }
      } catch (e) {
        returnValue = { ok: false, data: e }
        actionStatus = 500
      }
    } else {
      const formData = await request.formData()
      const decodedAction = await decodeAction(formData)
      try {
        const result = await decodedAction()
        formState = await decodeFormState(result, formData)
      } catch (e) {
        return new Response('Server Action Error', { status: 500 })
      }
    }
  }

  const rootNode = await Effect.runPromise(
    routes.matchAndRender(renderRequest.url) as Effect.Effect<JSX.Element>
  )

  const rscPayload: RscPayload = {
    root: <Root>{rootNode}</Root>,
    formState,
    returnValue,
  }

  const rscStream = renderToReadableStream<RscPayload>(rscPayload, {
    temporaryReferences,
  })

  if (renderRequest.isRsc)
    return new Response(rscStream, {
      status: actionStatus,
      headers: { 'content-type': 'text/x-component;charset=utf-8' },
    })

  const ssrEntryModule = await import.meta.viteRsc.loadModule<
    typeof import('@/core/entry.ssr.tsx')
  >('ssr', 'index')

  const ssrResult = await ssrEntryModule.renderHTML(rscStream, {
    formState,
    debugNojs: renderRequest.url.searchParams.has('__nojs'),
  })

  return new Response(ssrResult.stream, {
    status: ssrResult.status,
    headers: { 'Content-type': 'text/html' },
  })
}
