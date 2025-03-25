import { createRouter as createRouterTanStack } from '@tanstack/react-router'
import { root } from './routes/__root'
import { referenceIndex } from './routes/reference.index'
import { reference$type$field } from './routes/reference.$type.$field'
import { index } from './routes'

const routeTree = root.addChildren([
  index,
  referenceIndex.addChildren([
    reference$type$field,
  ]),
])

export const createRouter = () => {
  return createRouterTanStack({
    routeTree,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
