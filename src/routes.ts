import { RouteBuilder } from '@/core/route-builder'
import RootLayout from '@/root'
import DynamicRoute from '@/routes/[id]'
import IndexRoute from '@/routes/_index'
import ApiHelloRoute from '@/routes/api/hello'
import { AppService } from '@/services/app.service'

const WebRoutes = RouteBuilder.empty
  .layout(RootLayout)
  .add(IndexRoute)
  .add(DynamicRoute)
  .provide(AppService.layer)

const ApiRoutes = RouteBuilder.empty.prefix('/api').add(ApiHelloRoute)

export default RouteBuilder.empty
  .merge(ApiRoutes)
  .merge(WebRoutes)

  .cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  })
