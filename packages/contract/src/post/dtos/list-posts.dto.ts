import * as Schema from 'effect/Schema'

import { PostSchema } from '@/post/schemas/post.schema'
import { apiResponse, pagination } from '@/shared'

export class ListPostsDto extends Schema.TaggedClass<ListPostsDto>()(
  'post/application/ListPostsDto',
  apiResponse({
    data: Schema.Struct({
      posts: Schema.Array(PostSchema),
      meta: pagination.output,
    }),
  })
) {}

export namespace ListPostsDto {
  export const Input = Schema.Struct({
    ...pagination.input,
    query: Schema.optionalKey(Schema.String),
  })
  export type Input = typeof Input.Type

  export const Output = ListPostsDto.fields.data
  export type Output = typeof Output.Type
}
