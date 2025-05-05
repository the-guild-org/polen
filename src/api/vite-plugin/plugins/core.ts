import { memoize } from 'es-toolkit'
import { readSchemaPointer } from '../../configurator/schema-pointer.js'
import { titleCase } from '#lib/prelude/prelude.js'
import jsesc from 'jsesc'
import { ViteVirtual } from '#lib/vite-virtual/index.js'
import { Vite } from '#dep/vite/index.js'
import { Page } from '../../page/index.js'
import type { ProjectData, SiteNavigationItem } from '../../../project-data.js'
import { sourcePaths } from '../../../source-paths.js'
import { vi } from '../helpers.js'
import type { Configurator } from '../../configurator/index.js'
import { Schema } from '../../schema/index.js'
import { Superjson } from '#lib/superjson/index.js'

const viAssetGraphqlSchema = vi(`assets`, `graphql-schema`)
const viTemplateVariables = vi(`template`, `variables`)
const viTemplateSchemaAugmentations = vi(`template`, `schema-augmentations`)
const viProjectPages = vi(`project`, `pages.jsx`)
const viProjectData = vi(`project`, `data`)

export const Core = (config: Configurator.Config): Vite.PluginOption => {
  const readPages = memoize(Page.readAll)
  const readSchema = memoize(async () => {
    const schema = await Schema.readOrThrow({
      projectRoot: viteConfig.root,
    })
    return schema
  })

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
          const schema = await readSchema()
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

          const siteNavigationItems: SiteNavigationItem[] = [
            { path: `/reference`, title: `Reference` },
            ...siteNavigationItemsFromTopLevelPages,
          ]

          if (schema && schema.versions.length > 1) {
            siteNavigationItems.push({ path: `/changelog`, title: `Changelog` })
          }

          const projectData: ProjectData = {
            schema,
            siteNavigationItems,
          }

          const projectDataCode = jsesc(Superjson.stringify(projectData))
          const content = `
            import { Superjson } from '${sourcePaths.dir}/lib/superjson/index.js'
            
            export const PROJECT_DATA = Superjson.parse('${projectDataCode}')
          `

          return content
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
