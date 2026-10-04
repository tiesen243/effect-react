import * as DateTime from 'effect/DateTime'
import * as Schema from 'effect/Schema'

export const PostId = Schema.Number.pipe(Schema.brand('post/domain/PostId'))
export type PostId = typeof PostId.Type

export const PostSchema = Schema.Struct({
  id: PostId,
  title: Schema.String.check(
    Schema.isMinLength(1, {
      message: 'Title must be at least 1 character long',
    }),
    Schema.isMaxLength(100, {
      message: 'Title must be at most 100 characters long',
    })
  ),
  content: Schema.String.check(
    Schema.isMinLength(1, {
      message: 'Content must be at least 1 character long',
    })
  ),
  createdAt: Schema.DateTimeUtc.pipe(
    Schema.withConstructorDefault(DateTime.now)
  ),
  updatedAt: Schema.DateTimeUtc.pipe(
    Schema.withConstructorDefault(DateTime.now)
  ),
})
export type PostSchema = typeof PostSchema.Type
