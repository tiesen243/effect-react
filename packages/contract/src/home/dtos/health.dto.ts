import * as Schema from 'effect/Schema'

import { apiResponse } from '@/shared'

export class HomeHealthDto extends Schema.TaggedClass<HomeHealthDto>()(
  'post/application/HomeHealthDto',
  apiResponse({
    message: 'Health check successful',
    data: Schema.Struct({
      status: Schema.Literal('ok'),
    }),
  })
) {}

export namespace HomeHealthDto {
  export const Input = Schema.Void
  export type Input = typeof Input.Type

  export const Output = HomeHealthDto.fields.data
  export type Output = typeof Output.Type
}
