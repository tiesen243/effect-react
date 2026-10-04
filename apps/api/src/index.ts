import type { HttpServerResponse } from 'effect/http/HttpServerResponse'

import * as NodeHttpPlatform from '@effect/platform-bun/BunHttpPlatform'
import * as BunPath from '@effect/platform-bun/BunPath'
import * as Cloudflare from 'alchemy/Cloudflare'
import * as Effect from 'effect/Effect'
import * as Etag from 'effect/http/Etag'
import * as HttpRouter from 'effect/http/HttpRouter'
import * as Layer from 'effect/Layer'

import { AppModule } from '@/modules/app.module'

export default Cloudflare.Worker(
  'api',
  { main: import.meta.url },
  Effect.gen(function* () {
    const application = AppModule.createApi({
      persistenceDriver: 'in-memory',
    })

    const httpEffect = (yield* HttpRouter.toHttpEffect(
      application.pipe(
        Layer.provide([Etag.layer, NodeHttpPlatform.layer, BunPath.layer]),
        Layer.provide(
          HttpRouter.cors({
            allowedOrigins: ['http://localhost:1337', 'http://localhost:1338'],
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
              'Content-Type',
              'Authorization',
              'b3',
              'traceparent',
              'x-requested-with',
            ],
            credentials: true,
          })
        )
      )
    )) as Effect.Effect<HttpServerResponse>

    return {
      fetch: httpEffect,
    }
  })
)
