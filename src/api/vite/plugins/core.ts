import type { Vite } from '#dep/vite/index.js'
import { ViteVirtual } from '#lib/vite-virtual/index.js'
import { Cache, Str } from '@wollybeard/kit'
import jsesc from 'jsesc'
import { packagePaths } from '../../../package-paths.js'
import type { ProjectData, SiteNavigationItem } from '../../../project-data.js'
import { superjson } from '../../../singletons/superjson.js'
import type { Configurator } from '../../configurator/index.js'
import { Page } from '../../page/index.js'
import { SchemaAugmentation } from '../../schema-augmentation/index.js'
import { Schema } from '../../schema/index.js'
import { logger } from '../logger.js'
import { vi } from '../vi.js'

const viTemplateVariables = vi(`template`, `variables`)
const viTemplateSchemaAugmentations = vi(`template`, `schema-augmentations`)
const viProjectPages = vi(`project`, `pages.jsx`)
const viProjectData = vi(`project`, `data`)

export const Core = (config: Configurator.Config): Vite.PluginOption => {
  const readPages = Cache.memoize(Page.readAll)
  const readSchema = Cache.memoize(async () => {
    const schema = await Schema.readOrThrow({
      ...config.schema,
      projectRoot: viteConfig.root,
    })
    // todo: augmentations scoped to a version
    schema?.versions.forEach(version => {
      SchemaAugmentation.apply(version.after, config.schemaAugmentations)
    })
    return schema
  })

  let viteConfig: Vite.ResolvedConfig

  return {
    name: `polen:core`,
    config() {
      return {
        root: config.paths.framework,
        customLogger: logger,
      }
    },
    configResolved(config_) {
      viteConfig = config_
    },
    ...ViteVirtual.IdentifiedLoader.toHooks(
      {
        identifier: viTemplateVariables,
        loader: () => {
          const moduleContent = `export const templateVariables = ${JSON.stringify(config.templateVariables)}`
          return moduleContent
        },
      },
      {
        identifier: viTemplateSchemaAugmentations,
        loader: () => {
          const moduleContent = `export const schemaAugmentations = ${JSON.stringify(config.schemaAugmentations)}`
          return moduleContent
        },
      },
      {
        identifier: viProjectData,
        loader: async () => {
          const schema = await readSchema()
          const pages = Page.lint(await readPages({ dir: viteConfig.root })).fixed

          const siteNavigationItems: SiteNavigationItem[] = []

          const siteNavigationItemsFromTopLevelPages = pages
            // todo: test that non-congent page branches aren't shown in navigation bar
            .filter(_ =>
              _.type === `PageBranchContent`
              || _.branches.find(_ => _.route.type === `RouteIndex`)
            )
            .map(
              (pageBranch): ProjectData[`siteNavigationItems`][number] => {
                return {
                  path: pageBranch.route.path.raw,
                  title: Str.Case.title(pageBranch.route.path.raw),
                }
              },
            )

          siteNavigationItems.push(...siteNavigationItemsFromTopLevelPages)

          if (schema) {
            siteNavigationItems.push({ path: `/reference`, title: `Reference` })
            siteNavigationItems.push({ path: `/changelog`, title: `Changelog` })
          }

          const projectData: ProjectData = {
            schema,
            siteNavigationItems,
            faviconPath: `/logo.svg`,
          }

          const projectDataCode = jsesc(superjson.stringify(projectData))
          const content = `
            import { superjson } from '${packagePaths.sourceDir}/singletons/superjson.js'

            export const PROJECT_DATA = superjson.parse('${projectDataCode}')
          `

          return content
        },
      },
      {
        identifier: viProjectPages,
        loader: async () => {
          const pages = Page.lint(await readPages({ dir: viteConfig.root }))
          // return `import * as X from 'polen/react/jsx-dev-runtime'; console.log(X); export const pages = [];`
          const moduleContent = Page.ReactRouterAdaptor.render({
            pageTree: pages.fixed,
            sourcePaths: {
              reactRouterHelpers: `${packagePaths.dir}/lib/react-router-helpers.js`,
            },
          })

          // todo: improve
          pages.warnings.forEach(_ => {
            console.log(_.type)
          })

          return moduleContent
        },
      },
    ),
  }
}
