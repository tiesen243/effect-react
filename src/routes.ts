import { RouteBuilder } from '@/framework'
import { RootLayout } from '@/root'
import IndexRoute from '@/routes/index'

export default RouteBuilder.empty.layout(RootLayout).add('/', IndexRoute)
