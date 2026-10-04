import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '@/lib/runtime'

export const PostQuery: React.FC = () => {
  const listPostsQuery = useQuery({
    ...api.post.list.queryOptions({
      query: {},
    }),
    select: (r) => r.data,
  })

  const createPostMutation = useMutation({
    ...api.post.create.mutationOptions(),
    onSuccess: () => listPostsQuery.refetch(),
  })

  if (listPostsQuery.isLoading || !listPostsQuery.data)
    return <p>Loading posts…</p>

  return (
    <>
      <pre>{JSON.stringify(listPostsQuery.data, null, 2)}</pre>

      <button
        onClick={() => {
          createPostMutation.mutate({
            title: 'New Post',
            content: 'This is a new post.',
          })
        }}
      >
        Create Post
      </button>
    </>
  )
}
