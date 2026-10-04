import { Api } from '@effect-react/contract'
import * as Context from 'effect/Context'
import * as Function from 'effect/Function'
import * as HttpApiClient from 'effect/http-api/HttpApiClient'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import * as HttpClient from 'effect/http/HttpClient'
import * as HttpClientRequest from 'effect/http/HttpClientRequest'
import * as Layer from 'effect/Layer'

export class ApiClient extends Context.Service<
  ApiClient,
  HttpApiClient.ForApi<typeof Api>
>()('ApiClient', {
  make: HttpApiClient.make(Api, {
    transformClient: (client) =>
      client.pipe(
        HttpClient.mapRequest(
          Function.flow(
            HttpClientRequest.prependUrl(import.meta.env.VITE_API_URL),
            HttpClientRequest.setHeader('x-requested-with', 'web')
          )
        )
      ),
  }),
}) {
  public static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(FetchHttpClient.layer)
  )
}
