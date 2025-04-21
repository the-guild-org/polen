import { Configurator } from '../configurator/_namespace.js'
import * as HonoNodeServer from '@hono/node-server'
import type { Hono } from '../lib/hono/_namespace.js'
import { Vite } from '../lib/vite/_namespace.js'
import ReactVite from '@vitejs/plugin-react-swc'
import { vi } from './helpers.js'
import { Build } from './build.js'
import { ViteVirtual } from '../lib/vite-virtual/_namespace.js'
import { readSchemaPointer } from '../configurator/schema-pointer.js'
import { sourcePaths } from '../source-paths.js'
import { Page } from '../page/_namespace.js'
import { casesHandled, titleCase } from '../lib/prelude/main.js'
import type { ProjectData } from '../project-data.js'
import { memoize } from '../lib/memoize.js'

const viAssetGraphqlSchema = vi([`assets`, `graphql-schema`])
const viTemplateVariables = vi([`template`, `variables`])
const viTemplateSchemaAugmentations = vi([`template`, `schema-augmentations`])
const viProjectPages = vi([`project`, `pages.jsx`])
const viProjectData = vi([`project`, `data`])

const codes = {
  MODULE_LEVEL_DIRECTIVE: `MODULE_LEVEL_DIRECTIVE`,
  CIRCULAR_DEPENDENCY: `CIRCULAR_DEPENDENCY`,
}

export const VitePlugin = async (
  polenConfigInput?: Configurator.ConfigInput,
): Promise<Vite.PluginOption> => {
  const polenConfig = Configurator.normalizeInput(polenConfigInput)
  return VitePluginInternal(polenConfig)
}

// todo: rather than current __prop system
// declare module 'vite' {
//   interface UserConfig {
//     polen?: Configurator.ConfigInput
//   }
// }

export const VitePluginInternal = (
  polenConfig: Configurator.Config,
): Vite.PluginOption => {
  const debug = true
  let config: Vite.ResolvedConfig

  const readPages = memoize(Page.readAll)

  return [
    ReactVite(),
    {
      name: `pollen:get-config-resolved`,
      configResolved(config_) {
        config = config_
      },
    },
    ViteVirtual.Plugin(
      [viAssetGraphqlSchema, async () => {
        const schema = await readSchemaPointer(polenConfig.schema, config.root)
        const moduleContent = `export default ${JSON.stringify(schema)}`
        return moduleContent
      }],
      [viTemplateVariables, () => {
        const moduleContent = `export const templateVariables = ${
          JSON.stringify(polenConfig.templateVariables)
        }`
        return moduleContent
      }],
      [viTemplateSchemaAugmentations, () => {
        const moduleContent = `export const schemaAugmentations = ${
          JSON.stringify(polenConfig.schemaAugmentations)
        }`
        return moduleContent
      }],
      [viProjectData, async () => {
        const pages = Page.lint(await readPages({ dir: config.root })).fixed
        const siteNavigationItemsFromTopLevelPages = pages
          // todo: test that non-congent page branches aren't shown in navigation bar
          .filter(_ =>
            _.type === `PageBranchContent` ||
            _.branches.find(_ => _.route.type === `RouteIndex`)
          )
          .map(
            (pageBranch): ProjectData[`siteNavigationItems`][number] => {
              return {
                path: pageBranch.route.path.raw,
                title: titleCase(pageBranch.route.path.raw),
              }
            },
          )
        const projectData: ProjectData = {
          siteNavigationItems: [
            { path: `/reference`, title: `Reference` },
            ...siteNavigationItemsFromTopLevelPages,
          ],
        }
        const moduleContent = `export const PROJECT_DATA = ${JSON.stringify(projectData)}`
        return moduleContent
      }],
      [viProjectPages, async () => {
        const $ = {
          pages: `pages`,
          createRoute: `createRoute`,
          createRouteIndex: `createRouteIndex`,
        }

        const renderCodePageBranchBranches = (pageBranch: Page.PageBranch): string[] => {
          return pageBranch.branches.map(renderCodePageBranchRoute)
        }

        const renderCodePageBranchRoute = (pageBranch: Page.PageBranch): string => {
          switch (pageBranch.type) {
            case `PageBranchContent`: {
              switch (pageBranch.route.type) {
                case `RouteItem`:
                  return `
                ${$.createRoute}({
                  path: '${pageBranch.route.path.raw}',
                  Component: () => ${pageBranch.content.html},
                  children: [${renderCodePageBranchBranches(pageBranch).join(`,\n`)}],
                })
              `
                case `RouteIndex`:
                  return `
                    ${$.createRouteIndex}({
                      Component: () => ${pageBranch.content.html},
                    })
                  `
                default:
                  return casesHandled(pageBranch.route)
              }
            }
            case `PageBranchSegment`: {
              return `
                ${$.createRoute}({
                  path: '${pageBranch.route.path.raw}',
                  children: [${renderCodePageBranchBranches(pageBranch).join(`,\n`)}],
                })
              `
            }
            default: {
              return casesHandled(pageBranch)
            }
          }
        }

        const pages = Page.lint(await readPages({ dir: config.root }))

        // todo: improve
        pages.warnings.forEach(_ => {
          console.log(_.type)
        })

        const moduleContent = `
          import {
            ${$.createRoute},
            ${$.createRouteIndex}
          } from '${sourcePaths.dir}/lib/react-router-helpers.js'
          
          export const ${$.pages} = [
            ${pages.fixed.map(renderCodePageBranchRoute).join(`,\n`)}
          ]
        `

        return moduleContent
      }],
    ),
    {
      name: `polen:dev-server`,
      apply: `serve`,
      async configureServer(server) {
        // Load our entry server

        let honoApp: Hono.Hono
        try {
          const ssrloadedModule = await server.ssrLoadModule(
            polenConfig.paths.appTemplate.entryServer,
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
          server.middlewares.use((req, res, _next) => {
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
    },
    {
      name: `polen:build-client`,
      apply: `build`,
      applyToEnvironment: Vite.isEnvironmentClient,

      // HACK: For some reason the ?url import doesn't lead to a rewrite in the build.
      // Furthermore we need to rely on the manifest to get its final name because it is
      // generated by the client build before the server build.
      // However, we still need the asset in development.
      // But we cannot exclude the import in build.
      // So this does that for us but it is really hacky.
      // FIXME
      // 1. Raise issue about having ?url lead to expected build path rewrite?
      // 2. And: Move asset generation to server build?
      // 3. And/or: Use Vite Environments API?
      generateBundle(_, bundle, isWrite) {
        if (isWrite) {
          for (const chunkOrAsset of Object.values(bundle)) {
            if (chunkOrAsset.type === `asset` && chunkOrAsset.names.includes(`entry.client.jsx`)) {
              // eslint-disable-next-line
              delete bundle[chunkOrAsset.fileName]
            }
          }
        }
      },
      onLog(level, message) {
        if (
          level === `warn` && message.code === codes.MODULE_LEVEL_DIRECTIVE &&
          message.id?.includes(`@radix-ui`)
        ) return
      },

      config() {
        return {
          environments: {
            client: {
              build: {
                minify: !debug,
                manifest: true,
                rollupOptions: {
                  input: [polenConfig.paths.appTemplate.entryClient],
                },
              },
            },
          },
        }
      },
    },
    Build({
      entryServerPath: polenConfig.paths.appTemplate.entryServer,
      debug: debug,
    }),
  ]
}
