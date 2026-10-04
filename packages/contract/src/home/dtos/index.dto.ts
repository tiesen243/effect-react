import * as Schema from 'effect/Schema'

import { apiResponse } from '@/shared'

export class HomeIndexDto extends Schema.TaggedClass<HomeIndexDto>()(
  'post/application/HomeIndexDto',
  apiResponse({
    message: 'Welcome to the home page',
  })
) {}

export namespace HomeIndexDto {
  export const Input = Schema.Void
  export type Input = typeof Input.Type

  export const Output = HomeIndexDto.fields.data
  export type Output = typeof Output.Type
}
