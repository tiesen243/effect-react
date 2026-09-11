import { Effect } from 'effect'

import { Counter } from '@/components/counter'
import { Route } from '@/core/route'

export default Route.make({
  component: Effect.fn(function* () {
    yield* Effect.sleep(10)

    return (
      <main>
        <h1>Effect + Vite RSC</h1>

        <Counter />
      </main>
    )
  }),
})
