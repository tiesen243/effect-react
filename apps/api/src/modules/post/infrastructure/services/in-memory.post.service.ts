import { PostNotFound } from '@effect-react/contract/post/schemas/post.error'
import {
  PostId,
  PostSchema,
} from '@effect-react/contract/post/schemas/post.schema'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Ref from 'effect/Ref'

import { PostService } from '@/modules/post/application/ports/post.service'

export const InMemoryPostService = Layer.effect(
  PostService,
  Effect.gen(function* () {
    const postRef = yield* Ref.make(new Map<PostId, PostSchema>())

    return PostService.of({
      list: Effect.fn(function* (input) {
        const { page = 1, limit = 10, query = '' } = input

        const posts = yield* Ref.get(postRef).pipe(
          Effect.map((map) => [...map.values()])
        )

        const filteredPosts = posts.filter((post) =>
          post.title.toLowerCase().includes(query.toLowerCase())
        )

        const paginatedPosts = filteredPosts.slice(
          (page - 1) * limit,
          page * limit
        )

        return {
          posts: paginatedPosts,
          meta: {
            page,
            pageSize: limit,
            total: filteredPosts.length,
            totalPages: Math.ceil(filteredPosts.length / limit),
          },
        }
      }),

      get: Effect.fn(function* (input) {
        const { id } = input

        const post = yield* Ref.get(postRef).pipe(
          Effect.map((map) => map.get(id))
        )

        if (!post) return yield* new PostNotFound()

        return post
      }),

      create: Effect.fn(function* (input) {
        const { title, content } = input

        const id = yield* Ref.get(postRef).pipe(
          Effect.map((map) => (map.size + 1) as PostId)
        )

        yield* Ref.update(postRef, (map) => {
          map.set(id, PostSchema.make({ id, title, content }))
          return map
        })

        return { id }
      }),
    })
  })
)
