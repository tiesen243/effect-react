import * as Effect from 'effect/Effect'

import { createRoute } from '@/core/route'

export default createRoute({
  path: '/hello',

  loader: (_params, request) =>
    Effect.succeed({
      method: request.method,
      message: 'Hello from GET',
    }),

  action: (_params, request) =>
    Effect.tryPromise({
      try: async () => {
        const body = request.headers
          .get('content-type')
          ?.includes('application/json')
          ? await request.json()
          : undefined

        return {
          method: request.method,
          message: 'Hello from POST',
          body,
        }
      },
      catch: (error) =>
        error instanceof Error ? error : new Error(String(error)),
    }),
})
