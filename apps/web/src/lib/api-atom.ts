import { Api } from '@effect-react/contract'
import * as Function from 'effect/Function'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import * as HttpClient from 'effect/http/HttpClient'
import * as HttpClientRequest from 'effect/http/HttpClientRequest'
import * as AtomHttpApi from 'effect/reactivity/AtomHttpApi'

export class ApiClient extends AtomHttpApi.Service<ApiClient>()('ApiClient', {
  api: Api,

  httpClient: FetchHttpClient.layer,

  transformClient: (client) =>
    client.pipe(
      HttpClient.mapRequest(
        Function.flow(
          HttpClientRequest.prependUrl(import.meta.env.VITE_API_URL),
          HttpClientRequest.setHeader('x-requested-with', 'web')
        )
      )
    ),
}) {}
