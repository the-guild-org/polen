import { Markdown } from '#api/singletons/markdown/index.js'
import type { ReactRouter } from '#dep/react-router/index.js'
import type { Vite } from '#dep/vite/index.js'
import { FileRouter } from '#lib/file-router/index.js'
import { ViteVirtual } from '#lib/vite-virtual/index.js'
import mdx from '@mdx-js/rollup'
import { Cache, Fs, Json, Path, Str } from '@wollybeard/kit'
import jsesc from 'jsesc'
import remarkGfm from 'remark-gfm'
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

const viProjectPages = pvi([`project`, `pages.jsx`], { allowPluginProcessing: true })
export interface ProjectPagesModule {
  pages: ReactRouter.RouteObject[]
}

export const Core = (config: Configurator.Config): Vite.PluginOption[] => {
  const scanPageRoutes = Cache.memoize(async () =>
    await FileRouter.scan({
      dir: config.paths.project.absolute.pages,
      glob: `**/*.{md,mdx}`,
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

  return [
    // @see https://mdxjs.com/docs/getting-started/#vite
    {
      enforce: `pre`,
      ...mdx({
        remarkPlugins: [
          remarkGfm,
        ],
      }),
    },
    {
      name: `polen:markdown`,
      enforce: `pre`,
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
          const htmlString = await Markdown.parse(markdownString)

          const code = `export default ${JSON.stringify(htmlString)}`
          return code
        }
        return null
      },
    },
    {
      name: `polen:core:alias`,
      resolveId(id, importer) {
        if (!(importer && pvi.includes(importer))) return null

        const find = Str.pattern<{ groups: [`path`] }>(/^#(?<path>.+)/)
        const match = Str.match(id, find)
        if (!match) return null

        const replacement = `${config.paths.framework.sourceDir}/${match.groups.path}`
        return replacement
      },
    },
    {
      name: `polen:core`,
      config(_, { command }) {
        // isServing = command === `serve`
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
            const s = `export const templateVariables = ${JSON.stringify(config.templateVariables)}`
            return s
          },
        },
        {
          identifier: viTemplateSchemaAugmentations,
          loader() {
            const s = `export const schemaAugmentations = ${JSON.stringify(config.schemaAugmentations)}`
            return s
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
        {
          identifier: viProjectPages,
          async loader() {
            const pagesScanResult = await scanPageRoutes()

            const $ = {
              pages: `pages`,
            }

            const s = Str.Builder()
            s`export const ${$.pages} = []`

            // todo: kit fs should accept parsed file paths
            for (const route of pagesScanResult.routes) {
              const filePath = Path.format(route.file.path.absolute)
              const path = FileRouter.routeToString(route)
              const ident = Str.Case.camel(`page ` + Str.titlizeSlug(path))

              s`
                import ${ident} from '${filePath}'

                ${$.pages}.push({
                  path: '${path}',
                  Component: () => {
                    if (typeof ${ident} === 'function') {
                      // ━ MDX
                      const Component = ${ident}
                      return <Component />
                    } else {
                      // ━ MD
                      return <div dangerouslySetInnerHTML={{ __html: ${ident} }} />
                    }
                  }
                })
              `
            }

            return s.render()
          },
        },
      ),
    },
  ]
}
