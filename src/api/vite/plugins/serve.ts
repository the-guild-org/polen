import type { Config } from '#api/config/index'
import { reportError } from '#api/server/report-error'
import type { Hono } from '#dep/hono/index'
import type { Vite } from '#dep/vite/index'
import { createHtmlTransformer } from '#lib/html-utils/html-transformer'
import { ResponseInternalServerError } from '#lib/kit-temp'
import { debugPolen } from '#singletons/debug'
import * as HonoNodeServer from '@hono/node-server'
import { Err } from '@wollybeard/kit'

type App = Hono.Hono

interface AppOptions {
  hooks?: {
    transformHtml?: ((html: string, ctx: Hono.Context) => Promise<string> | string)[]
  }
}

interface AppServerModule {
  createApp: (options: AppOptions) => App
}

export const Serve = (
  config: Config.Config,
): Vite.PluginOption => {
  const debug = debugPolen.sub(`serve`)
  const appModulePath = config.paths.framework.template.absolute.server.app

  let appPromise: Promise<App | Error>

  const isNeedAppLoadOrReload = (server: Vite.ViteDevServer): boolean => {
    const appModule = server.moduleGraph.getModuleById(appModulePath)
    if (!appModule) return true // Not loaded yet

    // Check if the module or any of its dependencies are invalidated
    const checkInvalidated = (mod: Vite.ModuleNode, visited = new Set<string>()): boolean => {
      if (!mod.id || visited.has(mod.id)) return false
      visited.add(mod.id)

      // Check if this module is invalidated
      // SSR modules use ssrInvalidationState, client modules use invalidationState
      if (mod.ssrInvalidationState === `HARD_INVALIDATED` || mod.invalidationState === `HARD_INVALIDATED`) {
        return true
      }

      // Also check if transformResult is null (indicates invalidation)
      if (mod.ssrTransformResult === null && mod.transformResult === null) {
        return true
      }

      // Check all imported modules recursively
      for (const imported of mod.importedModules) {
        if (checkInvalidated(imported, visited)) return true
      }

      return false
    }

    return checkInvalidated(appModule)
  }

  const reloadApp = async (server: Vite.ViteDevServer): Promise<App | Error> => {
    debug(`reloadApp`)

    return server.ssrLoadModule(config.paths.framework.template.absolute.server.app)
      .then(module => module as AppServerModule)
      .then(module => {
        return module.createApp({
          hooks: {
            transformHtml: [
              // Inject entry client script for development
              createHtmlTransformer((html, ___ctx) => {
                const entryClientPath = `/${config.paths.framework.template.relative.client.entrypoint}`
                const entryClientScript = `<script type="module" src="${entryClientPath}"></script>`
                return html.replace(`</body>`, `${entryClientScript}\n</body>`)
              }),
              // Apply Vite's transformations
              createHtmlTransformer(async (html, ctx) => {
                return await server.transformIndexHtml(ctx.req.url, html)
              }),
            ],
          },
        })
      })
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
      debug(`handleHotUpdate`)
      // Reload app server immediately in the background
      appPromise = reloadApp(server)
    },
    async configureServer(server) {
      debug(`configureServer`)
      // Initial load
      appPromise = reloadApp(server)

      return () => {
        // Remove index.html serving middleware.
        server.middlewares.stack.splice(
          // @ts-expect-error
          server.middlewares.stack.findIndex(m => m.handle.name === `viteHtmlFallbackMiddleware`),
          1,
        )

        // Add middleware that runs our entry server
        server.middlewares.use((req, res, ___next) => {
          // Check if app needs reloading due to module invalidation
          if (isNeedAppLoadOrReload(server)) {
            appPromise = reloadApp(server)
          }

          void HonoNodeServer.getRequestListener(async request => {
            // Always await the current app promise
            const app = await appPromise
            if (Err.is(app)) {
              // Err.log(app)
              return ResponseInternalServerError()
            }

            return await app.fetch(request)
          })(req, res)
        })
      }
    },
  }
}
