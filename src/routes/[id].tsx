import { Effect, Schema } from 'effect'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/core/react'
import { createRoute } from '@/core/route'

export default createRoute({
  path: '/dynamic/:id',

  params: Schema.Struct({ id: Schema.String }),

  component: ({ params }) =>
    Effect.succeed(
      <main className='p-4'>
        <Typography variant='h1'>Dynamic Route</Typography>
        <Typography>Route ID: {params.id}</Typography>

        <Button render={<Link href='/' />}>Go Home</Button>
      </main>
    ),
})
