import * as HonoNodeServer from '@hono/node-server'
import type { Hono } from '../../../lib-dependencies/hono/index.js'
import type { Vite } from '../../../lib-dependencies/vite/index.js'

export const Serve = (
  config: {
    entryServer: string,
  },
): Vite.PluginOption => {
  return {
    name: `polen:serve`,
    apply: `serve`,
    async configureServer(server) {
      // Load our entry server

      let honoApp: Hono.Hono
      try {
        const ssrloadedModule = await server.ssrLoadModule(
          config.entryServer,
          // polenConfig.paths.appTemplate.entryServer,
        )
        // console.log(ssrloadedModule)
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
            allow: [
              // todo allow from polen
            ],
          },
        },
        optimizeDeps: {
          // Polen is already ESM and does not have many internal modules.
          // https://vite.dev/guide/dep-pre-bundling.html#customizing-the-behavior
          exclude: [`polen`],
          // include: [
          //   // `react`,
          //   // `react/jsx-runtime`,
          //   // `react/jsx-dev-runtime`,
          //   // reactPath,
          //   // reactJsxRuntimePath,
          //   // reactJsxDevRuntimePath,
          // ],
        },
        // Make it possible for ReactVite to find react dependency within Polen.
        // resolve: {
        //   alias: [
        //     // { find: `react`, replacement: reactPath },
        //     // { find: `react/jsx-runtime`, replacement: reactJsxRuntimePath },
        //     // { find: `react/jsx-dev-runtime`, replacement: reactJsxDevRuntimePath },
        //     // {
        //     //   find: `react`,
        //     //   replacement: `polen/dependencies/react`,
        //     // },
        //     // {
        //     //   find: `react/jsx-runtime`,
        //     //   replacement: `polen/dependencies/react/jsx-runtime`,
        //     // },
        //     // {
        //     //   find: `react/jsx-dev-runtime`,
        //     //   replacement: `polen/dependencies/react/jsx-dev-runtime`,
        //     // },
        //   ],
        // },
        // server: {
        // middlewareMode: true,
        // },
      }
    },
  }
}
