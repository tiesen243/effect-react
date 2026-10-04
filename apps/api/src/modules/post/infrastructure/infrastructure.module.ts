import { Layer } from 'effect'

import type { AppModule } from '@/modules/app.module'

import { InMemoryPostService } from '@/modules/post/infrastructure/services/in-memory.post.service'
import { PostgresPostService } from '@/modules/post/infrastructure/services/postgres.post.service'

export class PostInfrastructureModule {
  public static create(config: Pick<AppModule.Config, 'persistenceDriver'>) {
    const service = Layer.suspend(() =>
      config.persistenceDriver === 'in-memory' ? this.inMemory : this.postgres
    )

    return {
      service,
    }
  }

  private static get inMemory() {
    return Layer.mergeAll(InMemoryPostService)
  }

  private static get postgres() {
    return Layer.mergeAll(PostgresPostService)
  }
}
