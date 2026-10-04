import { createTanstackQueryOptionsProxy } from '@tiesen/effect-tanstack-query'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'

import { ApiClient } from '@/lib/api-query'

const appLayer = Layer.mergeAll(ApiClient.layer)

export const runtime = ManagedRuntime.make(appLayer)
export const api = createTanstackQueryOptionsProxy(ApiClient, runtime)
