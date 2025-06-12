import type { Config } from '#api/config/index'
import type { Hono } from '#dep/hono/index'
import type { Vite } from '#dep/vite/index'
import { debug } from '#singletons/debug'
import * as HonoNodeServer from '@hono/node-server'
import { Err, Http } from '@wollybeard/kit'
import cleanStack from 'clean-stack'
import { ErrorParser } from 'youch-core'

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
          const stack = cleanStack(error.stack, {
            pathFilter: (path) => {
              return !path.match(/.*(?:rolldown-vite|rolldown).*/)
            },
            basePath: config.paths.project.rootDir,
            // pretty: true,
          })
          error.stack = stack
          // ━ Log Error
          Err.log(error)
          const parser = new ErrorParser()
          const parsedError = await parser.parse(error)
          const snippet = parsedError.frames[0]?.source?.map(line => {
            return line.lineNumber.toString().padStart(4, ' ') + `: ` + line.chunk
          }).join(`\n`)
          if (snippet) {
            console.log('-----------------------------')
            console.log(snippet)
          }
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
              return new Response(null, {
                status: Http.Status.InternalServerError.code,
                statusText: Http.Status.InternalServerError.description,
              })
            }
            const response = await app.fetch(request, { viteDevServer: server })
            return response
          })(req, res)
        })
      }
    },
  }
}
