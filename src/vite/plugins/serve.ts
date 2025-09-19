import type { Api } from '#api/$'
import { reportError } from '#api/server/report-error'
import { O } from '#dep/effect'
import type { Vite } from '#dep/vite/index'
import { createHtmlTransformer } from '#lib/html-utils/html-transformer'
import { debugPolen } from '#singletons/debug'
import type { App, AppOptions } from '#template/server/app'
import { NodeFileSystem } from '@effect/platform-node'
import { FileSystem } from '@effect/platform/FileSystem'
import * as HonoNodeServer from '@hono/node-server'
import { Err, Http } from '@wollybeard/kit'
import { Path } from '@wollybeard/kit'
import { Effect } from 'effect'

interface AppServerModule {
  createApp: (options: AppOptions) => App
}

type AppPromise = AppPromiseGeneric<App>

type PluginScope = { server?: Vite.ViteDevServer | undefined }

export const Serve = (
  config: Api.Config.Config,
): Vite.PluginOption => {
  const PLUGIN_SCOPE: PluginScope = {}

  const debug = debugPolen.sub(`serve`)
  const appModulePath = config.paths.framework.template.absolute.server.app

  let appPromise: AppPromise

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

  const reloadApp = async (server: Vite.ViteDevServer): AppPromise => {
    debug(`reloadApp`)

    const appOption = await ssrLoadModule<AppServerModule>(server, config.paths.framework.template.absolute.server.app)

    return O.match(appOption, {
      onNone: () => O.none<App | Error>(),
      onSome: (appOrError) => {
        if (Err.is(appOrError)) {
          return O.some<App | Error>(appOrError)
        }

        return O.some(appOrError.createApp({
          hooks: {
            transformHtml: [
              // Inject entry client script for development
              createHtmlTransformer((html, ___ctx) => {
                const entryClientPath = `/${config.paths.framework.template.relative.client.entrypoint}`
                const entryClientScript = `<script type="module" src="${entryClientPath}"></script>`
                return Effect.succeed(html.replace(`</body>`, `${entryClientScript}\n</body>`))
              }),
              // Apply Vite's transformations
              createHtmlTransformer((html, ctx) => {
                return Effect.tryPromise({
                  try: () => server.transformIndexHtml(ctx.req.url, html),
                  catch: (error) => new Error(`Failed to transform HTML: ${String(error)}`),
                }).pipe(Effect.orDie)
              }),
            ],
          },
          paths: {
            base: config.build.base,
            assets: {
              // Calculate relative path from CWD to Polen's assets
              // CWD is user's project directory where they run 'pnpm dev'
              // Assets are in Polen's dev assets directory
              directory: Path.relative(
                process.cwd(),
                config.paths.framework.devAssets.absolute,
              ),
              route: config.server.routes.assets,
            },
          },
        }))
      },
    })
  }

  return {
    name: `polen:serve`,
    apply: `serve`,
    config() {
      return {
        server: {
          port: config.server.port,
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

      PLUGIN_SCOPE.server = server

      // Ensure the dev assets directory exists before server starts
      // This prevents the serveStatic middleware from logging warnings
      const assetsDir = config.paths.framework.devAssets.absolute
      await Effect.gen(function*() {
        const fs = yield* FileSystem
        yield* fs.makeDirectory(assetsDir, { recursive: true })
        debug(`Ensured dev assets directory exists: ${assetsDir}`)
      }).pipe(
        Effect.provide(NodeFileSystem.layer),
        Effect.runPromise,
      )

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
            const appOption = await appPromise

            return O.match(appOption, {
              onNone: () => Http.Response.internalServerError(),
              onSome: async (appOrError) => {
                if (Err.is(appOrError)) {
                  return Http.Response.internalServerError()
                }
                return await appOrError.fetch(request)
              },
            })
          })(req, res)
        })
      }
    },
    buildStart() {
      if (PLUGIN_SCOPE.server) {
        appPromise = reloadApp(PLUGIN_SCOPE.server)
      }
    },
  }
}

// Helpers

const isServerClosing = (server: Vite.ViteDevServer): boolean => {
  // @ts-expect-error
  return Boolean(server.environments.ssr._closing)
}

const isFetchTransportDisconnectError = (error: Error): boolean => {
  const regex = /transport was disconnected.*fetchModule/
  return regex.test(error.message)
}
/**
 * O.none() when dev server was closed/is closing making ssrLoadModule impossible to succeed.
 */
type AppPromiseGeneric<$AppServerModule> = Promise<O.Option<$AppServerModule | Error>>

const ssrLoadModule = async <$AppServerModule>(
  server: Vite.ViteDevServer,
  appModulePath: string,
): AppPromiseGeneric<$AppServerModule> => {
  return await server
    // .ssrLoadModule(config.paths.framework.template.absolute.server.app)
    .ssrLoadModule(appModulePath)
    .then(module => O.some(module as $AppServerModule))
    .catch(async (error) => {
      if (isFetchTransportDisconnectError(error) && isServerClosing(server)) return O.none()
      if (Err.is(error)) {
        // ━ Clean Stack Trace
        server.ssrFixStacktrace(error)
        reportError(error)
        return O.some(error)
      }
      throw error
    })
}
