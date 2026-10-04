import * as Schema from 'effect/Schema'

import { PostId, PostSchema } from '@/post/schemas/post.schema'
import { apiResponse } from '@/shared'

export class CreatePostDto extends Schema.TaggedClass<CreatePostDto>()(
  'post/application/CreatePostDto',
  apiResponse({
    data: Schema.Struct({
      id: PostId,
    }),
  })
) {}

export namespace CreatePostDto {
  export const Input = Schema.Struct({
    title: PostSchema.fields.title,
    content: PostSchema.fields.content,
  })
  export type Input = typeof Input.Type

  export const Output = CreatePostDto.fields.data
  export type Output = typeof Output.Type
}
