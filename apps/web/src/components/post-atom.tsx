import { useAtomValue, useAtomSet } from '@effect/atom-react'
import * as AsyncResult from 'effect/reactivity/AsyncResult'

import { ApiClient } from '@/lib/api-atom'

export const PostAtom = () => {
  const listPostsAtom = useAtomValue(
    ApiClient.query('post', 'list', {
      reactivityKeys: ['post:list'],
      query: {},
    })
  )

  const createPostAtom = useAtomSet(ApiClient.mutation('post', 'create'))

  const posts = AsyncResult.getOrElse(listPostsAtom, () => null)

  if (AsyncResult.isWaiting(listPostsAtom) || !posts?.data)
    return <p>Loading posts…</p>

  return (
    <>
      <pre>{JSON.stringify(posts.data, null, 2)}</pre>

      <button
        onClick={() => {
          createPostAtom({
            payload: { title: 'New Post', content: 'This is a new post.' },
            reactivityKeys: ['post:list'],
          })
        }}
      >
        Create Post
      </button>
    </>
  )
}
