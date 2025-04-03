// import TanStackRouterVite from '@tanstack/router-plugin/vite'
import { Configurator } from './configurator/_namespace.js'
import type { Vite } from '../lib/vite/_namespace.js'
// import { arrayify } from '../lib/prelude/main.js'
import ReactVite_ from '@vitejs/plugin-react'
import { Fs } from '../lib/fs/_namespace.js'
import HonoBuild from '@hono/vite-build/node'
import HonoDevServer from '@hono/vite-dev-server'
import HonoDevServerNodeAdapter from '@hono/vite-dev-server/node'
import { Path } from '../lib/path/_namespace.js'
import { debug } from '../lib/debug/_exports.js'
// import { Nitro } from '../lib/nitro/_namespace.js'

const ReactVite = ReactVite_ // as typeof ReactViteForType

const resolveVirtualIdentifier = (id: string) => `\0${id}`
const virtualIdentifier = (id: string) => `virtual:pollen/${id.replace(/^\//, ``)}`
const virtualIdentifierAsset = (id: string) => virtualIdentifier(`assets/${id.replace(/^\//, ``)}`)
const virtualIdentifierResolved = (id: string) => resolveVirtualIdentifier(virtualIdentifier(id))

const virtualIdentifierAssetGraphqlSchema = virtualIdentifierAsset(`graphql-schema`)

export const VitePlugin = (
  pollenConfigInput?: Configurator.ConfigInput,
): Vite.PluginOption[] => {
  const pollenConfig = Configurator.normalizeInput(pollenConfigInput)

  // let viteConfigInput: Vite.InlineConfig
  // let viteConfigResolved: Vite.ResolvedConfig
  const viteRoot = process.cwd()
  // console.log(Path.relative(viteRoot, pollenConfig.paths.appTemplate.entryServer))

  return [
    ...ReactVite(),
    pollenConfig.mode === `client` ? false : HonoBuild({
      entry: Path.relative(viteRoot, pollenConfig.paths.appTemplate.entryServer),
      staticRoot: `/dist`,
      staticPaths: [`/assets/*`],
      emptyOutDir: false,
      minify: false,
    }),
    {
      name: `pollen-core`,
      resolveId(id) {
        debug(`resolveId`, { id })
        if (id === virtualIdentifierAssetGraphqlSchema) {
          return resolveVirtualIdentifier(virtualIdentifierAssetGraphqlSchema)
        }
        return undefined
      },
      async load(id) {
        if (id === resolveVirtualIdentifier(virtualIdentifierAssetGraphqlSchema)) {
          debug(`Loading virtual graphql schema`)
          const schema = await Fs.readFile(pollenConfig.schema.path, `utf-8`)
          const moduleContent = `export default ${JSON.stringify(schema)}`
          return moduleContent
        }
        return undefined
      },
      config(config) {
        // viteConfigInput = config
        return {
          // publicDir: Path.join(pollenConfig.paths.outViteDir, `/assets`),
          //   resolve: {
          //     alias: {
          //       [pollenConfig.aliases.entryServer]: pollenConfig.paths.appTemplate.entryServer,
          //     },
          //   },
          //   root: pollenConfig.paths.appTemplate.dir,
          //   appType: pollenConfig.ssr.enabled ? `custom` : `spa`,
          environments: {
            client: {
              build: {
                // manifest: true,
                // ssrManifest: true,
                // outDir: pollenConfig.paths.outViteDir,
                rollupOptions: {
                  input: [pollenConfig.paths.appTemplate.entryClient],
                  output: {
                    dir: `./dist`,
                    entryFileNames: `assets/entry.client.js`,
                  },
                },
              },
            },
            // ssr: {
            //   build: {
            //     outDir: pollenConfig.paths.outViteDir,
            //     rollupOptions: {
            //       input: [pollenConfig.paths.appTemplate.entryServer],
            //     },
            //   },
            // },
          },
        }
      },
      // configResolved(config) {
      //   viteConfigResolved = config
      // },
    },

    HonoDevServer({
      entry: pollenConfig.paths.appTemplate.entryServer,
      adapter: HonoDevServerNodeAdapter,
      injectClientScript: false,
    }),
  ]
}
