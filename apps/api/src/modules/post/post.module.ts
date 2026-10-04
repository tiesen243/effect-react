import * as Layer from 'effect/Layer'

import type { AppModule } from '@/modules/app.module'

import { PostInfrastructureModule } from '@/modules/post/infrastructure/infrastructure.module'
import { PostController } from '@/modules/post/presentation/http/post.controller'

export class PostModule {
  public static create(config: Pick<AppModule.Config, 'persistenceDriver'>) {
    const infrastructure = PostInfrastructureModule.create(config)

    return {
      controller: PostController.pipe(Layer.provide(infrastructure.service)),
    }
  }
}
