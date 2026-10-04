import Api from '@effect-react/api'
import * as Alchemy from 'alchemy'
import * as Cloudflare from 'alchemy/Cloudflare'
import * as Effect from 'effect/Effect'

export default Alchemy.Stack(
  'Effect React',
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const api = yield* Api

    const web = yield* Cloudflare.Website.Vite('web', {
      rootDir: '../../apps/web',
      main: '../../apps/web/workers/app.ts',
      env: {
        VITE_API_URL: api.url.as<string>(),
        VITE_WEB_URL: Cloudflare.Worker.URL,
      },
    })

    return {
      api: api.url.as<string>(),
      web: web.url.as<string>(),
    }
  })
)
