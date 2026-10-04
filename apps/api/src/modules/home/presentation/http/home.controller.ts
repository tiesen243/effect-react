import { Api } from '@effect-react/contract'
import { HomeHealthDto } from '@effect-react/contract/home/dtos/health.dto'
import { HomeIndexDto } from '@effect-react/contract/home/dtos/index.dto'
import * as Effect from 'effect/Effect'
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder'

export const HomeController = HttpApiBuilder.group(Api, 'home', (handlers) =>
  handlers
    .handle('index', () => Effect.succeed(new HomeIndexDto()))
    .handle('health', () =>
      Effect.succeed(new HomeHealthDto({ data: { status: 'ok' } }))
    )
)
