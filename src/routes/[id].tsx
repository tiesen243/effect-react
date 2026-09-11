import { Effect, Schema } from 'effect'

import { Counter } from '@/components/counter'
import { Route } from '@/core/route'

export default Route.make({
  params: Schema.Struct({ id: Schema.String }),

  component: Effect.fn(function* ({ id }) {
    return (
      <main>
        <h1>Effect + Vite RSC ({id})</h1>

        <Counter />
      </main>
    )
  }),
})
