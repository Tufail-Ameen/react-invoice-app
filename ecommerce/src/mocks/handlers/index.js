import { authHandlers } from './auth'
import { catalogHandlers } from './catalog'
import { customerHandlers } from './customers'
import { orderHandlers } from './orders'
import { systemHandlers } from './system'
import { userHandlers } from './users'

export const handlers = [
  ...authHandlers,
  ...catalogHandlers,
  ...customerHandlers,
  ...orderHandlers,
  ...userHandlers,
  ...systemHandlers,
]
