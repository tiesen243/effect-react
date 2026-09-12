import { RouteBuilder } from '@/core/route-builder'
import RootLayout from '@/root'
import DynamicRoute from '@/routes/[id]'
import IndexRoute from '@/routes/_index'
import ApiHelloRoute from '@/routes/api/hello'
import { AppService } from '@/services/app.service'

export default RouteBuilder.empty
  .layout(RootLayout)

  .add(ApiHelloRoute)

  .add(IndexRoute)

  .add(DynamicRoute)

  .provide(AppService.layer)
