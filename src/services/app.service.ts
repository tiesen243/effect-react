import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export class AppService extends Context.Service<
  AppService,
  {
    readonly greeting: (name: string) => Effect.Effect<string>
  }
>()('AppService', {
  make: Effect.succeed({
    greeting: (name: string) => Effect.succeed(`Hello, ${name}!`),
  }),
}) {
  public static readonly layer = Layer.effect(this, this.make)
}
