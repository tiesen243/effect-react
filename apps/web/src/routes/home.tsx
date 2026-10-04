import { useSearchParams } from 'react-router'

import { PostAtom } from '@/components/post-atom'
import { PostQuery } from '@/components/post-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { Route } from './+types/home'

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ]
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const client = searchParams.get('client') ?? 'query'

  return (
    <Tabs
      value={client}
      onValueChange={(value) => setSearchParams({ client: value })}
      className='container mx-auto p-4'
      render={<main />}
    >
      <TabsList variant='line'>
        <TabsTrigger value='query'>TanStack Query</TabsTrigger>
        <TabsTrigger value='atom'>Effect Atom</TabsTrigger>
      </TabsList>

      <TabsContent value='query'>
        <PostQuery />
      </TabsContent>

      <TabsContent value='atom'>
        <PostAtom />
      </TabsContent>
    </Tabs>
  )
}
