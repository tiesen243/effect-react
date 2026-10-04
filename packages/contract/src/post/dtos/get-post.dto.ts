import * as Schema from 'effect/Schema'

import { PostId, PostSchema } from '@/post/schemas/post.schema'
import { apiResponse } from '@/shared'

export class GetPostDto extends Schema.TaggedClass<GetPostDto>()(
  'post/application/GetPostDto',
  apiResponse({
    data: PostSchema,
  })
) {}

export namespace GetPostDto {
  export const Input = Schema.Struct({
    id: PostId,
  })
  export type Input = typeof Input.Type

  export const Output = GetPostDto.fields.data
  export type Output = typeof Output.Type
}
