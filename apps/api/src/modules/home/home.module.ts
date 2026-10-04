import { HomeController } from '@/modules/home/presentation/http/home.controller'

export class HomeModule {
  public static create() {
    return {
      controller: HomeController,
    }
  }
}
