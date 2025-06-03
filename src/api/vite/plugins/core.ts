import { Marked } from '#dep/marked/index.js'
import type { Vite } from '#dep/vite/index.js'
import { FileRouter } from '#lib/file-router/index.js'
import { ViteVirtual } from '#lib/vite-virtual/index.js'
import { Cache, Fs, Json, Path, Str } from '@wollybeard/kit'
import jsesc from 'jsesc'
import type { ProjectData, SiteNavigationItem } from '../../../project-data.js'
import { superjson } from '../../../singletons/superjson.js'
import type { Configurator } from '../../configurator/index.js'
import { SchemaAugmentation } from '../../schema-augmentation/index.js'
import { Schema } from '../../schema/index.js'
import { logger } from '../logger.js'
import { vi as pvi } from '../vi.js'

const viTemplateVariables = pvi([`template`, `variables`])
const viTemplateSchemaAugmentations = pvi([`template`, `schema-augmentations`])
const viProjectData = pvi([`project`, `data`])
const viProjectPages = pvi([`project`, `pages`])

export const Core = (config: Configurator.Config): Vite.PluginOption[] => {
  let isServing = false
  const scanPageRoutes = Cache.memoize(async () =>
    await FileRouter.scan({
      dir: config.paths.project.absolute.pages,
      glob: `**/*.md`,
    })
  )
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
    name: `polen:markdown`,
    resolveId(id) {
      if (id.endsWith(`.md`)) {
        return id
      }
      return null
    },
    async load(id) {
      if (id.endsWith(`.md`)) {
        const markdownString = await Fs.read(id)
        if (!markdownString) return null
        const htmlString = await Marked.parse(markdownString)
        const code = `export default ${JSON.stringify(htmlString)}`
        return code
      }
      return null
    },
  }, {
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
      isServing = command === `serve`
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
          // todo: parallel
          const schema = await readSchema()
          const pagesScanResult = await scanPageRoutes()

          const siteNavigationItems: SiteNavigationItem[] = []

          const siteNavigationItemsFromTopLevelPages = pagesScanResult.routes
            // We exclude home page
            .filter(route => route.path.segments.length === 1)
            .map(route => {
              const path = FileRouter.routeToString(route)
              console.log(path)
              const title = Str.titlizeSlug(path)
              return {
                path,
                title,
              }
            })

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
            pagesScanResult: pagesScanResult,
            paths: config.paths.project,
            server: {
              static: {
                // todo
                // relative from CWD of process that boots n1ode server
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
      // {
      //   identifier: viProjectPages,
      //   async loader() {
      //     console.log('')
      //     const pages = Pages.lint(
      //       await readPages({
      //         dir: config.paths.project.absolute.pages,
      //       }),
      //     )

      //     const moduleContent = Pages.ReactRouterAdaptor.render({
      //       pageTree: pages.fixed,
      //       sourcePaths: {
      //         reactRouterHelpers: `#lib/react-router-aid/react-router-aid.js`,
      //       },
      //     })

      //     // todo: improve
      //     pages.warnings.forEach(_ => {
      //       console.log(_.type)
      //     })

      //     return moduleContent
      //   },
      // },
      {
        identifier: viProjectPages,
        async loader() {
          const pagesScanResult = await scanPageRoutes()
          
          // In development, we'll load content lazily
          if (isServing) {
            const pageRouteMap: Record<string, string> = {}
            
            // Just map routes to file paths for lazy loading
            for (const route of pagesScanResult.routes) {
              const routePath = FileRouter.routeToString(route)
              pageRouteMap[routePath] = Path.format(route.file.path.absolute)
            }
            
            const moduleContent = `
              import { Marked } from '#dep/marked/index.js'
              import { Fs } from '@wollybeard/kit'
              
              const pageRouteMap = ${JSON.stringify(pageRouteMap)}
              
              export const load = async (routePath) => {
                const filePath = pageRouteMap[routePath]
                if (!filePath) return null
                
                const markdownContent = await Fs.read(filePath)
                if (!markdownContent) return null
                
                return await Marked.parse(markdownContent)
              }
              
              export const data = null // Not used in dev mode
            `
            
            return moduleContent
          }
          
          // In production build, pre-process all content
          const pageContentMap: Record<string, string> = {}
          
          for (const route of pagesScanResult.routes) {
            const routePath = FileRouter.routeToString(route)
            const markdownContent = await Fs.read(Path.format(route.file.path.absolute))
            if (markdownContent) {
              const htmlContent = await Marked.parse(markdownContent)
              pageContentMap[routePath] = htmlContent
            }
          }
          
          const moduleContent = `
            export const data = ${JSON.stringify(pageContentMap)}
            export const load = null // Not used in production
          `
          
          return moduleContent
        },
      },
    ),
  }]
}
