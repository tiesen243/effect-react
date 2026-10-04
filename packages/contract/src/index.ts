import { HttpApi } from 'effect/http-api'

import { HomeApiGroup } from '@/home/group'
import { PostApiGroup } from '@/post/group'

export class Api extends HttpApi.make('api')

  .add(HomeApiGroup)

  .add(PostApiGroup) {}
