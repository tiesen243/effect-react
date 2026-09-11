import type { Effect } from 'effect'
import type { Schema } from 'effect/Schema'
import type { JSX } from 'react/jsx-runtime'

export interface RouteOptions<A, R1, E1, R2, E2> {
  params?: Schema<A>
  action?: (params: A) => Effect.Effect<any, E1, R1>
  component?: (params: A) => Effect.Effect<JSX.Element, E2, R2>
}

export class Route<
  A = any,
  R1 = unknown,
  E1 = unknown,
  R2 = never,
  E2 = never,
> {
  readonly options: RouteOptions<A, R1, E1, R2, E2>

  private constructor(options: RouteOptions<A, R1, E1, R2, E2>) {
    this.options = options
  }

  public static make<A, R1, E1, R2, E2>(
    options: RouteOptions<A, R1, E1, R2, E2>
  ) {
    return new Route(options)
  }
}
