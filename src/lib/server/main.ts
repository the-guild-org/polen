import { H3 } from '../h3/_namespace'
import type { Vite } from '../vite/_namespace'
import { EntryManager } from './lib/entry-manager/_namespace'

export { EntryManager } from './lib/entry-manager/_namespace'

export const createServer = async (viteServer: Vite.ViteDevServer): Promise<H3.App> => {
  const h3App = H3.createApp()

  h3App.use(H3.fromNodeMiddleware(viteServer.middlewares))

  const router = H3.createRouter()

  h3App.use(router)

  const entryServerModule = await EntryManager.importModule(viteServer)

  router.get(`/**`, entryServerModule.handler)

  return h3App
}
