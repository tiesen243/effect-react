import type { ReactFormState } from 'react-dom/client'

import {
  createFromReadableStream,
  getClientEntryUrl,
} from '@vitejs/plugin-rsc/ssr'
import React from 'react'
import { renderToReadableStream } from 'react-dom/server.edge'
import { injectRSCPayload } from 'rsc-html-stream/server'

import type { RscPayload } from '@/core/entry.rsc'

export async function renderHTML(
  rscStream: ReadableStream<Uint8Array>,
  options: {
    formState?: ReactFormState
    nonce?: string
    debugNojs?: boolean
  }
) {
  const [rscStream1, rscStream2] = rscStream.tee()

  let payload: Promise<RscPayload> | undefined
  function SsrRoot() {
    payload ??= createFromReadableStream<RscPayload>(rscStream1)
    return React.use(payload).root
  }

  const bootstrapScriptContent = `import(${JSON.stringify(getClientEntryUrl())})`

  let htmlStream = await renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent: options?.debugNojs
      ? undefined
      : bootstrapScriptContent,
    formState: options?.formState,
  })

  if (!options?.debugNojs)
    htmlStream = htmlStream.pipeThrough(
      injectRSCPayload(rscStream2, { nonce: options?.nonce })
    ) as never

  return { stream: htmlStream, status: 200 }
}
