import { memoize } from 'es-toolkit'
import { readSchemaPointer } from '../../configurator/schema-pointer.js'
import { casesHandled, titleCase } from '../../lib/prelude/main.js'
import { ViteVirtual } from '../../lib/vite-virtual/_namespace.js'
import { Vite } from '../../lib/vite/_namespace.js'
import { Page } from '../../page/_namespace.js'
import type { ProjectData } from '../../project-data.js'
import { sourcePaths } from '../../source-paths.js'
import { vi } from '../helpers.js'
import type { Configurator } from '../../configurator/index.js'

const viAssetGraphqlSchema = vi(`assets`, `graphql-schema`)
const viTemplateVariables = vi(`template`, `variables`)
const viTemplateSchemaAugmentations = vi(`template`, `schema-augmentations`)
const viProjectPages = vi(`project`, `pages.jsx`)
const viProjectData = vi(`project`, `data`)

export const Core = (config: Configurator.Config): Vite.PluginOption => {
  const readPages = memoize(Page.readAll)

  let viteConfig: Vite.ResolvedConfig

  return {
    name: `polen:core`,
    configResolved(config_) {
      viteConfig = config_
    },
    ...ViteVirtual.IdentifiedLoader.toHooks(
      {
        identifier: viAssetGraphqlSchema,
        loader: async () => {
          const schema = await readSchemaPointer(config.schema, viteConfig.root)
          const moduleContent = `export default ${JSON.stringify(schema)}`
          return moduleContent
        },
      },
      {
        identifier: viTemplateVariables,
        loader: () => {
          const moduleContent = `export const templateVariables = ${
            JSON.stringify(config.templateVariables)
          }`
          return moduleContent
        },
      },
      {
        identifier: viTemplateSchemaAugmentations,
        loader: () => {
          const moduleContent = `export const schemaAugmentations = ${
            JSON.stringify(config.schemaAugmentations)
          }`
          return moduleContent
        },
      },
      {
        identifier: viProjectData,
        loader: async () => {
          const pages = Page.lint(await readPages({ dir: viteConfig.root })).fixed
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

          const pages = Page.lint(await readPages({ dir: viteConfig.root }))

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
  }
}
