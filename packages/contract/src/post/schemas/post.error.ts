import * as Schema from 'effect/Schema'

import { apiResponse } from '@/shared'

export class PostNotFound extends Schema.TaggedError<PostNotFound>()(
  'post/domain/PostNotFound',
  apiResponse({
    status: 404,
    message: 'Post not found',
  }),
  { httpApiStatus: 404 }
) {}

export class PostError extends Schema.TaggedError<PostError>()(
  'post/domain/PostError',
  {
    reasons: Schema.Union([PostNotFound]),
  }
) {}
