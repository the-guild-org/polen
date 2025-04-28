import { memoize } from 'es-toolkit'
import { readSchemaPointer } from '../../configurator/schema-pointer.js'
import { titleCase } from '../../lib/prelude/main.js'
import { ViteVirtual } from '../../lib/vite-virtual/index.js'
import { Vite } from '../../lib-dep/vite/index.js'
import { Page } from '../../page/index.js'
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
          const pages = Page.lint(await readPages({ dir: viteConfig.root }))
          const moduleContent = Page.ReactRouterAdaptor.render({
            pageTree: pages.fixed,
            sourcePaths: {
              reactRouterHelpers: `${sourcePaths.dir}/lib/react-router-helpers.js`,
            },
          })

          // todo: improve
          pages.warnings.forEach(_ => {
            console.log(_.type)
          })

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
