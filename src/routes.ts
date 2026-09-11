import { Application } from '@/core/application'
import ShowRoute from '@/routes/[id]'
import HomeIndexRoute from '@/routes/home'

export default Application.empty.add('/', HomeIndexRoute).add('/:id', ShowRoute)
