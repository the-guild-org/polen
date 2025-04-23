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
      // transform(code, id, options) {
      //   if (id.endsWith(`virtual:polen/project/pages.jsx`)) {
      //     console.log(`transform?`, id, code)
      //   }
      // },
    },
    ViteVirtual.IdentifiedLoader.toPlugin(
      {
        identifier: viAssetGraphqlSchema,
        loader: async () => {
          const schema = await readSchemaPointer(polenConfig.schema, config.root)
          const moduleContent = `export default ${JSON.stringify(schema)}`
          return moduleContent
        },
      },
      {
        identifier: viTemplateVariables,
        loader: () => {
          const moduleContent = `export const templateVariables = ${
            JSON.stringify(polenConfig.templateVariables)
          }`
          return moduleContent
        },
      },
      {
        identifier: viTemplateSchemaAugmentations,
        loader: () => {
          const moduleContent = `export const schemaAugmentations = ${
            JSON.stringify(polenConfig.schemaAugmentations)
          }`
          return moduleContent
        },
      },
      {
        identifier: viProjectData,
        loader: async () => {
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
        },
      },
      {
        identifier: viProjectPages,
        loader: async () => {
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
          const moduleCotentTransformed = await Vite.transformWithEsbuild(
            moduleContent,
            `ignore.jsx`,
            {
              jsx: `automatic`,
            },
          )

          return moduleCotentTransformed
        },
      },
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
    Build({
      entryServerPath: polenConfig.paths.appTemplate.entryServer,
      clientEntryPath: polenConfig.paths.appTemplate.entryClient,
      debug: debug,
    }),
  ]
}
