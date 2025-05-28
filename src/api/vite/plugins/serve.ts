import type { Hono } from '#dep/hono/index.js'
import type { Vite } from '#dep/vite/index.js'
import * as HonoNodeServer from '@hono/node-server'
import type { Configurator } from '../../configurator/index.js'

export const Serve = (
  config: Configurator.Config,
): Vite.PluginOption => {
  return {
    name: `polen:serve`,
    apply: `serve`,
    async configureServer(server) {
      let honoApp: Hono.Hono

      try {
        const ssrloadedModule = await server.ssrLoadModule(config.paths.framework.template.server.entrypoint)
        honoApp = ssrloadedModule[`default`] as Hono.Hono
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
      // const reactPath = import.meta.resolve(`react`)
      // const reactJsxRuntimePath = import.meta.resolve(`react/jsx-runtime`)
      // const reactJsxDevRuntimePath = import.meta.resolve(`react/jsx-dev-runtime`)
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
