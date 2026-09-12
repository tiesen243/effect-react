import * as Effect from 'effect/Effect'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/core/react'
import { createRoute } from '@/core/route'
import { AppService } from '@/services/app.service'

export default createRoute({
  path: '/',

  loader: () => Effect.succeed({ message: 'Hello, World!' }),

  component: () =>
    Effect.gen(function* () {
      const appService = yield* AppService
      const greeting = yield* appService.greeting('User')

      return (
        <main className='p-4'>
          <Typography variant='h1'>Welcome to the Home Page</Typography>
          <Typography>
            This is the main landing page of the application.
          </Typography>

          <Typography>{greeting}</Typography>

          <Button render={<Link href={`/dynamic/${crypto.randomUUID()}`} />}>
            Go to Dynamic Route
          </Button>
        </main>
      )
    }),
})
