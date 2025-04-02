import TanStackRouterVite from '@tanstack/router-plugin/vite'
import { Configurator } from './configurator/_namespace.js'
import { Path } from '../lib/path/_namespace.js'
import { Vite } from '../lib/vite/_namespace.js'
import { arrayify } from '../lib/prelude/main.js'
import { Fs } from '../lib/fs/_namespace.js'
// import ReactVite_ from '@vitejs/plugin-react'

// const ReactVite = ReactVite_ // as typeof ReactViteForType

const resolveVirtualIdentifier = (id: string) => `\0${id}`
const virtualIdentifier = (id: string) => `virtual:pollen/${id.replace(/^\//, ``)}`
const virtualIdentifierAsset = (id: string) => virtualIdentifier(`assets/${id.replace(/^\//, ``)}`)
const virtualIdentifierResolved = (id: string) => resolveVirtualIdentifier(virtualIdentifier(id))

const virtualIdentifierAssetGraphqlSchema = virtualIdentifierAsset(`graphql-schema`)

export const VitePlugin = async (
  pollenConfigInput?: Configurator.ConfigInput,
): Promise<Vite.PluginOption[]> => {
  const pollenConfig = await Configurator.normalizeInput(pollenConfigInput)

  const tanStackPugins = arrayify(TanStackRouterVite({
    target: `react`,
    enableRouteGeneration: false,
    // autoCodeSplitting: true,
  }))

  let viteConfigInput: Vite.InlineConfig
  let viteConfigResolved: Vite.ResolvedConfig

  return [
    // ...ReactVite(),
    ...tanStackPugins,
    {
      name: `pollen-core`,
      resolveId(id) {
        console.log(id, virtualIdentifierAssetGraphqlSchema)
        if (id === virtualIdentifierAssetGraphqlSchema) {
          return resolveVirtualIdentifier(virtualIdentifierAssetGraphqlSchema)
        }
        return undefined
      },
      async load(id) {
        if (id === resolveVirtualIdentifier(virtualIdentifierAssetGraphqlSchema)) {
          console.log(`load`, id)
          const schema = await Fs.readFile(pollenConfig.schema.path, `utf-8`)
          const moduleContent = `export default ${JSON.stringify(schema)}`
          return moduleContent
        }
        return undefined
      },
      config(config) {
        viteConfigInput = config
        return {
          resolve: {
            alias: {
              [pollenConfig.aliases.entryServer]: pollenConfig.paths.appTemplate.entryServer,
            },
          },
          root: pollenConfig.paths.appTemplate.dir,
          appType: pollenConfig.ssr.enabled ? `custom` : `spa`,
          server: {
            port: 3000,
          },
          build: {
            rollupOptions: {
              onwarn(warning, defaultHandler) {
                const isTanStackNodeExternalizedWarning = warning.message.includes(`tanstack`) &&
                  warning.message.includes(`has been externalized for browser compatibility`)
                const isRadixModuleLevelDirectiveWarning = warning.message.includes(`radix`) &&
                  warning.message.includes(`Module level directives cause errors when bundled`)
                const isIgnoredWarning = isRadixModuleLevelDirectiveWarning ||
                  isTanStackNodeExternalizedWarning

                if (isIgnoredWarning) {
                  return
                }

                defaultHandler(warning)
              },
            },
          },
          environments: {
            client: {
              build: {
                outDir: pollenConfig.paths.outViteDir,
                rollupOptions: {
                  input: [pollenConfig.paths.appTemplate.entryClient],
                },
              },
            },
            ssr: {
              build: {
                outDir: pollenConfig.paths.outViteDir,
                rollupOptions: {
                  input: [pollenConfig.paths.appTemplate.entryServer],
                },
              },
            },
          },
        }
      },
      configResolved(config) {
        viteConfigResolved = config
        // console.log({ viteConfigResolved })
      },
      // configureServer(server) {
      //   return () => {
      //     remove_html_middlewares(server.middlewares)
      //     // eslint-disable-next-line
      //     server.middlewares.use(async (req, res) => {
      //       const entryServer = await EntryManager.importModule(pollenConfig, server)
      //       const event = H3.createEvent(req, res)
      //       const response = await entryServer.handler(event)
      //       await H3.sendWebResponse(event, response)
      //     })
      //   }
      // },
      async closeBundle() {
        const isNeedSsrBuild = viteConfigResolved.command === `build` &&
          viteConfigResolved.build.ssr !== true

        if (isNeedSsrBuild && false) {
          console.log(`isNeedSsrBuild = true`)
          console.log(pollenConfig.paths.appTemplate.entryServer)
          const viteConfigSsr = Vite.mergeRootConfig(viteConfigInput, {
            build: {
              ssr: true,
              emptyOutDir: false,
              rollupOptions: {
                input: [pollenConfig.paths.appTemplate.entryServer],
              },
            },
          })
          // console.log(`Building SSR...`)
          const bundle = await Vite.build(viteConfigSsr) as Vite.Rollup.RollupOutput
          const entryServerChunk = bundle.output.find(chunk => chunk.name === `entry.server`)!
          console.log(`Building server...`)
          const publicAssetsDir = Path.join(
            viteConfigResolved.build.outDir,
            viteConfigResolved.build.assetsDir,
          )
          // const nitro = await Nitro.createNitro({
          //   compatibilityDate: `2025-03-27`,
          //   publicAssets: [{
          //     dir: publicAssetsDir,
          //     baseURL: `/assets`,
          //   }],
          //   dev: false,
          //   alias: {
          //     [pollenConfig.aliases.entryServer]: Path.join(
          //       pollenConfig.paths.outViteDir,
          //       entryServerChunk.fileName,
          //     ),
          //   },
          //   renderer: `#pollen/server/entry`,
          //   output: {
          //     dir: pollenConfig.paths.outNitroDir,
          //   },
          //   typescript: {
          //     generateTsConfig: false,
          //   },
          // })
          // await Nitro.prepare(nitro)
          // await Nitro.copyPublicAssets(nitro)
          // await Nitro.build(nitro)
          // await nitro.close()
        }
      },
    },
  ]
}

/**
 * Removes Vite internal middleware
 */
function remove_html_middlewares(server: Vite.ViteDevServer[`middlewares`]) {
  const html_middlewares = [
    `viteIndexHtmlMiddleware`,
    `vite404Middleware`,
    `viteSpaFallbackMiddleware`,
  ]
  for (let i = server.stack.length - 1; i > 0; i--) {
    // @ts-expect-error
    if (html_middlewares.includes(server.stack[i].handle.name)) {
      server.stack.splice(i, 1)
    }
  }
}

// /**
//  * Formats error for SSR message in error overlay
//  */
// function prepareError(req: Vite.Connect.IncomingMessage, error: unknown) {
//   const e = error as Error
//   return {
//     message: `An error occured while server rendering ${req.url}:\n\n\t${
//       typeof e === `string` ? e : e.message
//     } `,
//     stack: typeof e === `string` ? `` : e.stack,
//   }
// }
