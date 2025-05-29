import type { Vite } from '#dep/vite/index.js'
import { FileRouter } from '#lib/file-router/index.js'
import { ViteVirtual } from '#lib/vite-virtual/index.js'
import { Cache, Json, Null, Str } from '@wollybeard/kit'
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
          __BUILD_ARCHITECTURE__: Json.codec.serialize(config.build.architecture),
          __BUILD_ARCHITECTURE_SSG__: Json.codec.serialize(config.build.architecture === `ssg`),
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
            .map(pageBranch => {
              switch (pageBranch.type) {
                case `PageBranchContent`:
                  // Home is handled by clicking on the site logo/title
                  if (pageBranch.route.isIndex) return null
                  // A top-level content page is a nav item (e.g., /about from about.md, or / from index.md)
                  return pageBranch
                case `PageBranchSegment`:
                  // A top-level segment (directory) is a nav item if it contains an index page
                  // (e.g., /docs from docs/index.md, where "docs" is the segment)
                  return Page.getPageBranchSegmentContent(pageBranch) ?? null
                default:
                  return null
              }
            })
            .filter(Null.isnt)
            .map(
              (pageBranch): ProjectData[`siteNavigationItems`][number] => {
                const path = pageBranch.route.path // This is "/" for root index, "foo" for foo.md or foo/index.md
                return {
                  path: path === FileRouter.rootPath ? path : `/${path}`, // Root is already "/", others get a leading slash
                  title: Str.Case.title(path === `/` ? `Home` : path), // "Home" for root, title-cased path otherwise
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
            paths: config.paths.project,
            server: {
              static: {
                // todo
                // relative from CWD of process that boots node server
                // can easily break! Use path relative in server??
                directory: `./` + config.paths.project.relative.build.root,
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
