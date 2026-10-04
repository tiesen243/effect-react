import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

export const apiResponse = <
  TData extends Schema.Constraint = Schema.withConstructorDefault<Schema.Null>,
  TError extends Schema.Constraint = Schema.withConstructorDefault<Schema.Null>,
>({
  status = 200,
  message = 'OK',
  data = Schema.Null.pipe(
    Schema.withConstructorDefault(Effect.succeed(null))
  ) as unknown as TData,
  error = Schema.Null.pipe(
    Schema.withConstructorDefault(Effect.succeed(null))
  ) as unknown as TError,
}: {
  status?: number
  message?: string
  data?: TData
  error?: TError
}) =>
  Schema.Struct({
    status: Schema.Number.pipe(
      Schema.withConstructorDefault(Effect.succeed(status))
    ),
    message: Schema.String.pipe(
      Schema.withConstructorDefault(Effect.succeed(message))
    ),
    data,
    error,
    timestamp: Schema.DateTimeUtc.pipe(
      Schema.withConstructorDefault(DateTime.now)
    ),
  })

export const pagination = {
  input: {
    page: Schema.optionalKey(Schema.Number).pipe(
      Schema.withConstructorDefault(Effect.succeed(1))
    ),
    limit: Schema.optionalKey(Schema.Number).pipe(
      Schema.withConstructorDefault(Effect.succeed(10))
    ),
  },
  output: Schema.Struct({
    page: Schema.Number,
    pageSize: Schema.Number,
    total: Schema.Number,
    totalPages: Schema.Number,
  }),
}
