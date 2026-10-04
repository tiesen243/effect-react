import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/http-api/HttpApiGroup'

import { HomeHealthDto } from '@/home/dtos/health.dto'
import { HomeIndexDto } from '@/home/dtos/index.dto'

export class HomeApiGroup extends HttpApiGroup.make('home')
  .add(
    HttpApiEndpoint.get('index', '/', {
      success: HomeIndexDto,
    })
  )

  .add(
    HttpApiEndpoint.get('health', '/health', {
      success: HomeHealthDto,
    })
  ) {}
