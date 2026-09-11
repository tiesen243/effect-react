import { Effect, Schema } from 'effect'
import { Suspense } from 'react'

import { Route } from '@/framework'
import { Counter } from '@/routes/index.client'

export default Route.make({
  params: Schema.Struct({}),

  loader: () => Effect.succeed({ message: 'Hello from the loader!' }),

  component: ({ loaderData }) =>
    Effect.gen(function* () {
      return (
        <main>
          <h1>Welcome to Effect RSC</h1>

          <Suspense fallback={<p>Loading heavy component...</p>}>
            <HeavyComponent />
          </Suspense>

          <p>{loaderData.message}</p>

          <Counter />
        </main>
      )
    }),
})

const HeavyComponent = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return <p>This is a heavy component that took 1 second to load.</p>
}
