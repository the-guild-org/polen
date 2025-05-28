import type { Vite } from '#dep/vite/index.js'
import { ViteVirtual } from '#lib/vite-virtual/index.js'
import { Cache, Json, Str } from '@wollybeard/kit'
import jsesc from 'jsesc'
import type { ProjectData, SiteNavigationItem } from '../../../project-data.js'
import { superjson } from '../../../singletons/superjson.js'
import type { Configurator } from '../../configurator/index.js'
import { Page } from '../../page/index.js'
import { SchemaAugmentation } from '../../schema-augmentation/index.js'
import { Schema } from '../../schema/index.js'
import { logger } from '../logger.js'
import { vi as pvi } from '../vi.js'

const viTemplateVariables = pvi([`template`, `variables`])
const viTemplateSchemaAugmentations = pvi([`template`, `schema-augmentations`])
const viProjectPages = pvi([`project`, `pages.jsx`], { allowPluginProcessing: true })
const viProjectData = pvi([`project`, `data`])

export const Core = (config: Configurator.Config): Vite.PluginOption[] => {
  const readPages = Cache.memoize(Page.readAll)
  const readSchema = Cache.memoize(async () => {
    const schema = await Schema.readOrThrow({
      ...config.schema,
      projectRoot: config.paths.project.rootDir,
    })
    // todo: augmentations scoped to a version
    schema?.versions.forEach(version => {
      SchemaAugmentation.apply(version.after, config.schemaAugmentations)
    })
    return schema
  })

  return [{
    name: `polen:core:alias`,
    resolveId(id, importer) {
      if (!(importer && pvi.includes(importer))) return null

      const find = Str.pattern<{ groups: [`path`] }>(/^#(?<path>.+)/)
      const match = Str.match(id, find)
      if (!match) return null

      const replacement = `${config.paths.framework.sourceDir}/${match.groups.path}`
      return replacement
    },
  }, {
    name: `polen:core`,
    config(_, { command }) {
      return {
        root: config.paths.framework.rootDir,
        define: {
          __BUILDING__: Json.codec.serialize(command === `build`),
          __SERVING__: Json.codec.serialize(command === `serve`),
          __COMMAND__: Json.codec.serialize(command),
          __BUILD_ARCHITECTURE__: Json.codec.serialize(config.build.type),
          __BUILD_ARCHITECTURE_SSG__: Json.codec.serialize(config.build.type === `ssg`),
        },
        server: {
          port: 3000,
        },
        customLogger: logger,
        build: {
          target: `esnext`,
          assetsDir: config.paths.project.relative.build.relative.assets,
          rollupOptions: {
            treeshake: `smallest`,
          },
          minify: !config.advanced.debug,
          outDir: config.paths.project.absolute.build.root,
          emptyOutDir: true, // disables warning that build dir not in root dir; expected b/c root dir = framework package
        },
      }
    },
    ...ViteVirtual.IdentifiedLoader.toHooks(
      {
        identifier: viTemplateVariables,
        loader() {
          const moduleContent = `export const templateVariables = ${JSON.stringify(config.templateVariables)}`
          return moduleContent
        },
      },
      {
        identifier: viTemplateSchemaAugmentations,
        loader() {
          const moduleContent = `export const schemaAugmentations = ${JSON.stringify(config.schemaAugmentations)}`
          return moduleContent
        },
      },
      {
        identifier: viProjectData,
        async loader() {
          const schema = await readSchema()
          const pages = Page.lint(
            await readPages({
              dir: config.paths.project.absolute.pages,
            }),
          ).fixed

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
            if (schema.versions.length > 1) {
              siteNavigationItems.push({ path: `/changelog`, title: `Changelog` })
            }
          }

          const projectData: ProjectData = {
            schema,
            siteNavigationItems,
            faviconPath: `/logo.svg`,
            server: {
              static: {
                // todo
                // relative from CWD of process that boots node server
                // can easily break! Use path relative in server??
                directory: `./dist`,
                // Uses Hono route syntax.
                route: `/` + config.paths.project.relative.build.relative.assets + `/*`,
              },
            },
          }

          const projectDataCode = jsesc(superjson.stringify(projectData))
          const content = `
            import { superjson } from '#singletons/superjson.js'

            export const PROJECT_DATA = superjson.parse('${projectDataCode}')
          `

          return content
        },
      },
      {
        identifier: viProjectPages,
        async loader() {
          const pages = Page.lint(
            await readPages({
              dir: config.paths.project.absolute.pages,
            }),
          )
          const moduleContent = Page.ReactRouterAdaptor.render({
            pageTree: pages.fixed,
            sourcePaths: {
              reactRouterHelpers: `#lib/react-router-aid/react-router-aid.js`,
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
  }]
}
