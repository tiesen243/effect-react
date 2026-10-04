import { Api } from '@effect-react/contract'
import { CreatePostDto } from '@effect-react/contract/post/dtos/create-post.dto'
import { GetPostDto } from '@effect-react/contract/post/dtos/get-post.dto'
import { ListPostsDto } from '@effect-react/contract/post/dtos/list-posts.dto'
import * as Effect from 'effect/Effect'
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder'

import { PostService } from '@/modules/post/application/ports/post.service'

export const PostController = HttpApiBuilder.group(Api, 'post', (handlers) =>
  handlers
    .handle('list', ({ query }) =>
      Effect.map(
        PostService.use((s) => s.list(query)),
        (data) => new ListPostsDto({ data })
      )
    )

    .handle('get', ({ query }) =>
      Effect.map(
        PostService.use((s) => s.get(query)),
        (data) => new GetPostDto({ data })
      )
    )

    .handle('create', ({ payload }) =>
      Effect.map(
        PostService.use((s) => s.create(payload)),
        (data) => new CreatePostDto({ data })
      )
    )
)
