import type { Config } from '#api/config/index'
import { reportError } from '#api/server/report-error'
import type { Hono } from '#dep/hono/index'
import type { Vite } from '#dep/vite/index'
import { ResponseInternalServerError } from '#lib/kit-temp'
import { debug } from '#singletons/debug'
import * as HonoNodeServer from '@hono/node-server'
import { Err } from '@wollybeard/kit'

type App = Hono.Hono

interface AppServerModule {
  app: App
}

export const Serve = (
  config: Config.Config,
): Vite.PluginOption => {
  const _debug = debug.sub(`serve`)
  let appPromise: Promise<App | Error>

  const reloadApp = async ({ server }: { server: Vite.ViteDevServer }): Promise<App | Error> => {
    _debug('reloadApp')
    return server.ssrLoadModule(config.paths.framework.template.server.app)
      .then(module => module as AppServerModule)
      .then(module => module.app)
      .catch(async (error) => {
        if (Err.is(error)) {
          // ━ Clean Stack Trace
          server.ssrFixStacktrace(error)
          reportError(error)
          return error
        }
        throw error
      })
  }

  return {
    name: `polen:serve`,
    apply: `serve`,
    config() {
      return {
        server: {
          port: 3000,
          watch: {
            disableGlobbing: false,
          },
          fs: {
            strict: false, // bring back true, with the allow below might already work now
            allow: [
              config.paths.project.rootDir,
            ],
          },
        },
      }
    },
    handleHotUpdate({ server }) {
      _debug('handleHotUpdate')
      // Reload app server immediately in the background
      appPromise = reloadApp({ server })
    },
    async configureServer(server) {
      _debug('configureServer')
      // Initial load
      appPromise = reloadApp({ server })

      return () => {
        // Remove index.html serving middleware.
        server.middlewares.stack.splice(
          // @ts-expect-error
          server.middlewares.stack.findIndex(m => m.handle.name === `viteHtmlFallbackMiddleware`),
          1,
        )

        // Add middleware that runs our entry server
        server.middlewares.use((req, res, ___next) => {
          void HonoNodeServer.getRequestListener(async request => {
            // Always await the current app promise
            const app = await appPromise
            if (Err.is(app)) {
              // Err.log(app)
              return ResponseInternalServerError()
            }
            const response = await app.fetch(request, { viteDevServer: server })
            return response
          })(req, res)
        })
      }
    },
  }
}
