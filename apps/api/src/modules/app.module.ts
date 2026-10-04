import { Api } from '@effect-react/contract'
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder'
import * as HttpApiScalar from 'effect/http-api/HttpApiScalar'
import * as Layer from 'effect/Layer'

import { HomeModule } from '@/modules/home/home.module'
import { PostModule } from '@/modules/post/post.module'

export class AppModule {
  private static init(config: AppModule.Config) {
    const home = HomeModule.create()
    const post = PostModule.create(config)

    return {
      home,
      post,
    }
  }

  public static createApi(config: AppModule.Config) {
    const modules = this.init(config)

    const apiRoutes = HttpApiBuilder.layer(Api, {
      openapiPath: '/openapi.json',
    }).pipe(Layer.provide([modules.home.controller, modules.post.controller]))

    const docRoutes = HttpApiScalar.layer(Api, {
      path: '/docs',
    })

    return Layer.merge(apiRoutes, docRoutes)
  }
}

export namespace AppModule {
  export interface Config {
    persistenceDriver: 'in-memory' | 'postgres'
  }
}
