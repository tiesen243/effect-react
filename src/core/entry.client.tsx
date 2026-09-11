import {
  createFromReadableStream,
  createFromFetch,
  setServerCallback,
  createTemporaryReferenceSet,
  encodeReply,
} from '@vitejs/plugin-rsc/browser'
import React from 'react'
import { hydrateRoot } from 'react-dom/client'
import { rscStream } from 'rsc-html-stream/client'

import type { RscPayload } from '@/core/entry.rsc'

import { createRscRenderRequest } from '@/core/request'

async function main() {
  let setPayload: (v: RscPayload) => void

  const initialPayload = await createFromReadableStream<RscPayload>(rscStream)

  function BrowserRoot() {
    const [payload, setPayload_] = React.useState(initialPayload)

    React.useEffect(() => {
      setPayload = (v) => React.startTransition(() => setPayload_(v))
    }, [])

    return payload.root
  }

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
    return payload.returnValue?.data
  })

  hydrateRoot(
    document,
    <React.StrictMode>
      <BrowserRoot />
    </React.StrictMode>,
    { formState: initialPayload.formState }
  )
}

main()
