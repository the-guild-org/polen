import type { Config } from '#api/config/index.ts'
import { checkIsSelfContainedImport as checkIsSelfContainedImport } from '#cli/_/self-contained-mode.ts'
import type { ReactRouter } from '#dep/react-router/index.ts'
import type { Vite } from '#dep/vite/index.ts'
import { FileRouter } from '#lib/file-router/index.ts'
import { ViteVirtual } from '#lib/vite-virtual/index.ts'
import { packagePaths } from '#package-paths.ts'
import { debug } from '#singletons/debug.ts'
import mdx from '@mdx-js/rollup'
import { Cache, Json, Path, Str } from '@wollybeard/kit'
import jsesc from 'jsesc'
import { fileURLToPath } from 'node:url'
import remarkGfm from 'remark-gfm'
import type { ProjectData, SidebarIndex, SiteNavigationItem } from '../../../project-data.ts'
import { superjson } from '../../../singletons/superjson.ts'
import { SchemaAugmentation } from '../../schema-augmentation/index.ts'
import { Schema } from '../../schema/index.ts'
import { logger } from '../logger.ts'
import { vi as pvi } from '../vi.ts'

const viTemplateVariables = pvi([`template`, `variables`])
const viTemplateSchemaAugmentations = pvi([`template`, `schema-augmentations`])
const viProjectData = pvi([`project`, `data`])

const viProjectPages = pvi([`project`, `pages.jsx`], { allowPluginProcessing: true })
export interface ProjectPagesModule {
  pages: ReactRouter.RouteObject[]
}

export const Core = (config: Config.Config): Vite.PluginOption[] => {
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

  const plugins: Vite.Plugin[] = []

  if (config.advanced.isSelfContainedMode) {
    const vitePluginPolenSelfContainedMode: Vite.Plugin = {
      name: `polen:self-contained-import`,
      resolveId(id, importer) {
        const d = debug.sub(`vite-plugin:self-contained-import`)
        if (
          checkIsSelfContainedImport({
            projectDirPathExp: config.paths.project.rootDir,
            specifier: id,
            importer: importer ?? ``,
          })
        ) {
          const to = fileURLToPath(import.meta.resolve(id))
          d(`did resolve`, { from: id, to })

          return to
        }
      },
    }
    plugins.push(vitePluginPolenSelfContainedMode)
  }

  return [
    ...plugins,

    // @see https://mdxjs.com/docs/getting-started/#vite
    {
      enforce: `pre`,
      // TODO: Use inline vite-plugin-mdx once transform hooks can change module type
      // @see https://github.com/rolldown/rolldown/issues/4004
      ...mdx({
        jsxImportSource: `polen/react`,
        remarkPlugins: [
          remarkGfm,
        ],
      }),
    },
    // TODO: We can remove, mdx subsumes this
    // TODO: First we need to investigate how e can make our api singleton Markdown used by MDX.
    // If we cannot, then we might want to ditch MDX instead and use our lower level solution here.
    // It depends in part on how complex our Markdown singleton gets.
    // {
    //   name: `polen:markdown`,
    //   enforce: `pre`,
    //   resolveId(id) {
    //     if (id.endsWith(`.md`)) {
    //       return id
    //     }
    //     return null
    //   },
    //   async load(id) {
    //     if (id.endsWith(`.md`)) {
    //       const markdownString = await Fs.read(id)
    //       if (!markdownString) return null
    //       const htmlString = await Markdown.parse(markdownString)

    //       const code = `export default ${JSON.stringify(htmlString)}`
    //       return code
    //     }
    //     return null
    //   },
    // },

    /**
     * If a `polen*` import is encountered from the user's project, resolve it to the currently
     * running source code of Polen rather than the user's node_modules.
     *
     * Useful for the following cases:
     *
     * 1. Main: Using Polen CLI from the source code against some local example/development project.
     *
     * 2. Secondary: Using Polen CLI on a project that does not have Polen installed.
     *    (User would likely not want to do this because they would not be able to achieve type safety)
     */

    {
      name: `polen:internal-import-alias`,
      resolveId(id, importer) {
        const d = debug.sub(`vite-plugin:internal-import-alias`)
        const isPolenImporterViaBuild = Boolean(importer?.includes(importer))
        const isPolenImporterViaSource = Boolean(importer?.includes(packagePaths.sourceDir))
        const isPolenImporter = isPolenImporterViaBuild || isPolenImporterViaSource
        if (!isPolenImporter) return null

        d(`check`)

        const find = Str.pattern<{ groups: [`path`] }>(/^#(?<path>.+)/)
        const match = Str.match(id, find)
        if (!match) return null

        const to = `${config.paths.framework.sourceDir}/${match.groups.path}`
        d(`did resolve`, { from: id, to })

        return to
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
          esbuild: false,
          // oxc: {
          //   jsx: {
          //     runtime: 'automatic',
          //     importSource: 'react',
          //   },
          // },
          build: {
            target: `esnext`,
            assetsDir: config.paths.project.relative.build.relative.assets,
            rollupOptions: {
              treeshake: {
                // Aggressive tree-shaking for smallest bundles
                moduleSideEffects: false, // Only include code if an export is actually used
                annotations: true, // Respect @__PURE__ annotations for better dead code elimination
                unknownGlobalSideEffects: false, // Assume global functions don't have side effects
              },
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

            //
            // ━━ Build Navbar
            //

            // ━ Top pages become navigation items
            const topPages = pagesScanResult.routes.filter(FileRouter.routeIsTopLevel)

            for (const page of topPages) {
              const path = FileRouter.routeToPathExpression(page)
              const title = Str.titlizeSlug(path)
              siteNavigationItems.push({ pathExp: path, title })
            }

            // ━ Top directories become navigation items
            const topDirsPaths = pagesScanResult.routes
              .filter(FileRouter.routeIsSubLevel)
              // todo: kit, slice that understands non-empty
              // Arr.slice(route.path.segments, 1)
              .map(route => [route.logical.path[0]])

            for (const dir of topDirsPaths) {
              const pathExp = FileRouter.pathToExpression(dir)
              const title = Str.titlizeSlug(pathExp)
              // todo: this should never happen, if it does, swarn user
              // Only add if not already added as a top page
              if (!siteNavigationItems.some(item => item.pathExp === pathExp)) {
                siteNavigationItems.push({ pathExp: pathExp, title })
              }
            }

            // ━ Schema presence causes adding some navbar items
            if (schema) {
              siteNavigationItems.push({ pathExp: `/reference`, title: `Reference` })
              if (schema.versions.length > 1) {
                siteNavigationItems.push({ pathExp: `/changelog`, title: `Changelog` })
              }
            }

            //
            // ━━ Build Sidebar
            //

            const sidebarIndex: SidebarIndex = {}

            for (const dirPath of topDirsPaths) {
              const childPages = pagesScanResult.routes.filter(page => FileRouter.routeIsSubOf(page, dirPath))
              sidebarIndex[FileRouter.pathToExpression(dirPath)] = FileRouter.Sidebar.build(childPages, dirPath)
            }

            //
            // ━━ Put It All together
            //

            const projectData: ProjectData = {
              schema,
              siteNavigationItems,
              sidebarIndex,
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
            import { superjson } from '#singletons/superjson.ts'

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
              const filePathExp = Path.format(route.file.path.absolute)
              const pathExp = FileRouter.routeToPathExpression(route)
              const ident = Str.Case.camel(`page ` + Str.titlizeSlug(pathExp))

              s`
                import ${ident} from '${filePathExp}'

                ${$.pages}.push({
                  path: '${pathExp}',
                  Component: ${ident}
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
