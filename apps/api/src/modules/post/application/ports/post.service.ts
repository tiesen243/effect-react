import type { CreatePostDto } from '@effect-react/contract/post/dtos/create-post.dto'
import type { GetPostDto } from '@effect-react/contract/post/dtos/get-post.dto'
import type { ListPostsDto } from '@effect-react/contract/post/dtos/list-posts.dto'
import type {
  PostError,
  PostNotFound,
} from '@effect-react/contract/post/schemas/post.error'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'

export class PostService extends Context.Service<
  PostService,
  {
    readonly list: (
      input: ListPostsDto.Input
    ) => Effect.Effect<ListPostsDto.Output, PostError>

    readonly get: (
      input: GetPostDto.Input
    ) => Effect.Effect<GetPostDto.Output, PostNotFound>

    readonly create: (
      input: CreatePostDto.Input
    ) => Effect.Effect<CreatePostDto.Output>
  }
>()('post/application/PostService') {}
