import type { Config } from '#api/config/index.ts'
import type { Hono } from '#dep/hono/index.ts'
import type { Vite } from '#dep/vite/index.ts'
import * as HonoNodeServer from '@hono/node-server'

export const Serve = (
  config: Config.Config,
): Vite.PluginOption => {
  return {
    name: `polen:serve`,
    apply: `serve`,
    async configureServer(server) {
      let honoApp: Hono.Hono

      try {
        const module = await server.ssrLoadModule(config.paths.framework.template.server.app) as { app: Hono.Hono }
        honoApp = module.app
      } catch (cause) {
        if (cause instanceof Error) {
          server.ssrFixStacktrace(cause)
        }
        throw cause
      }

      // Add middleware that runs our entry server

      return () => {
        // Remove index.html serving middleware.
        server.middlewares.stack.splice(
          // @ts-expect-error
          server.middlewares.stack.findIndex(m => m.handle.name === `viteHtmlFallbackMiddleware`),
          1,
        )
        server.middlewares.use((req, res, ___next) => {
          void HonoNodeServer.getRequestListener(async request => {
            // request.viteDevServer = server
            const response = await honoApp.fetch(request, { viteDevServer: server })
            return response
          })(req, res)
        })
      }
    },
    config() {
      return {
        server: {
          fs: {
            strict: false,
            allow: [
              // todo allow from polen
            ],
          },
        },
      }
    },
  }
}
