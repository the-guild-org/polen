import { createRouter as createRouterTanStack } from '@tanstack/react-router'
import { root } from './routes/__root'
import { referenceIndex } from './routes/reference.index'
import { reference$type$field } from './routes/reference.$type.$field'
import { index } from './routes'
import { reference$type } from './routes/reference.$type'

const routeTree = root.addChildren([
  index,
  referenceIndex.addChildren([
    reference$type,
    reference$type$field,
  ]),
])

export const createRouter = () => {
  const router = createRouterTanStack({
    routeTree,
    scrollRestoration: true,
  })
  // router.serverSsr?.injectScript
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
