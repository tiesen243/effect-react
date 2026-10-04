import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/http-api/HttpApiGroup'

import { CreatePostDto } from '@/post/dtos/create-post.dto'
import { GetPostDto } from '@/post/dtos/get-post.dto'
import { ListPostsDto } from '@/post/dtos/list-posts.dto'
import { PostError, PostNotFound } from '@/post/schemas/post.error'

export class PostApiGroup extends HttpApiGroup.make('post')
  .add(
    HttpApiEndpoint.get('list', '/', {
      query: ListPostsDto.Input,
      success: ListPostsDto,
      error: PostError,
    })
  )

  .add(
    HttpApiEndpoint.get('get', '/:id', {
      query: GetPostDto.Input,
      success: GetPostDto,
      error: [PostNotFound],
    })
  )

  .add(
    HttpApiEndpoint.post('create', '/', {
      payload: CreatePostDto.Input,
      success: CreatePostDto,
    })
  )

  .prefix('/api/posts') {}
