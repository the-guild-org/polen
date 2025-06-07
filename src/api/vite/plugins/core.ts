import type { Config } from '#api/config/index'
import { VitePluginSelfContainedMode } from '#cli/_/self-contained-mode'
import type { ReactRouter } from '#dep/react-router/index'
import type { Vite } from '#dep/vite/index'
import { FileRouter } from '#lib/file-router/index'
import { ViteVirtual } from '#lib/vite-virtual/index'
import { debug } from '#singletons/debug'
import { Json, Str } from '@wollybeard/kit'
import jsesc from 'jsesc'
import type { ProjectData, SidebarIndex, SiteNavigationItem } from '../../../project-data.ts'
import { superjson } from '../../../singletons/superjson.ts'
import { SchemaAugmentation } from '../../schema-augmentation/index.ts'
import { Schema } from '../../schema/index.ts'
import { logger } from '../logger.ts'
import { polenVirtual } from '../vi.ts'
import { createPagesPlugin, ensurePagesLoaded } from './pages.ts'

const viTemplateVariables = polenVirtual([`template`, `variables`])
const viTemplateSchemaAugmentations = polenVirtual([`template`, `schema-augmentations`])
const viProjectData = polenVirtual([`project`, `data`])

export interface ProjectPagesModule {
  pages: ReactRouter.RouteObject[]
}

export const Core = (config: Config.Config): Vite.PluginOption[] => {
  // State for current pages data (updated by pages plugin)
  let currentPagesData: FileRouter.ScanResult | null = null
  let viteDevServer: Vite.ViteDevServer | null = null

  // Schema cache management
  let schemaCache: Awaited<ReturnType<typeof Schema.readOrThrow>> | null = null

  const readSchema = async () => {
    if (schemaCache === null) {
      const schema = await Schema.readOrThrow({
        ...config.schema,
        projectRoot: config.paths.project.rootDir,
      })
      // todo: augmentations scoped to a version
      schema?.versions.forEach(version => {
        SchemaAugmentation.apply(version.after, config.schemaAugmentations)
      })
      schemaCache = schema
    }
    return schemaCache
  }

  const plugins: Vite.Plugin[] = []

  // Note: The main use for this right now is to resolve the react imports
  // from the mdx vite plugin which have to go through the Polen exports since Polen keeps those deps bundled.
  //
  // If we manage to get the mdx vite plugin that defers JSX transform to Rolldown then we can remove this!
  //
  if (config.advanced.isSelfContainedMode) {
    plugins.push(VitePluginSelfContainedMode({
      projectDirPathExp: config.paths.project.rootDir,
    }))
  }

  return [
    ...plugins,

    // Self-contained pages plugin
    ...createPagesPlugin({
      config,
      onPagesChange: (pages) => {
        currentPagesData = pages
        // When pages change, we also need to clear schema cache
        // and invalidate project data virtual module
        schemaCache = null

        if (viteDevServer) {
          const projectDataModule = viteDevServer.moduleGraph.getModuleById(viProjectData.resolved)
          if (projectDataModule) {
            viteDevServer.moduleGraph.invalidateModule(projectDataModule)
          }
        }
      },
    }),
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

        const isPolenImporter = Boolean(
          importer
            && (
              importer.startsWith(config.paths.framework.sourceDir)
              || polenVirtual.includes(importer)
              /*
                TODO: can we make index.html be in the source dir?
                Example case:

                POLEN   VITE_PLUGIN_INTERNAL_IMPORT_ALIAS   CHECK  {
                  id: '#singletons/superjson',
                  importer: '/Users/jasonkuhrt/projects/the-guild-org/polen/index.html',
                  isPolenImporter: false
                }
              */
              || (importer.startsWith(config.paths.framework.rootDir) && importer.endsWith(`index.html`))
            ),
        )

        if (!isPolenImporter) return null
        d(`check candidate`, { id, importer, isPolenImporter })

        const find = Str.pattern<{ groups: [`path`] }>(/^#(?<path>.+)/)
        const match = Str.match(id, find)
        if (!match) return null

        const to = `${config.paths.framework.sourceDir}/${match.groups.path}${config.paths.framework.sourceExtension}`
        d(`did resolve`, { from: id, to })

        return to
      },
    },
    {
      name: `polen:core`,
      configureServer(server) {
        viteDevServer = server
      },
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
            fs: {
              allow: [
                config.paths.project.rootDir,
              ],
            },
            watch: {
              disableGlobbing: false,
            },
          },
          customLogger: logger,
          esbuild: false,
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
            debug(`Loading viProjectData virtual module`)
            // todo: parallel
            const schema = await readSchema()

            // Get pages data from the pages plugin or load initially
            if (!currentPagesData) {
              debug(`Loading pages data initially`)
              currentPagesData = await ensurePagesLoaded(config)
            }
            const pagesScanResult = currentPagesData
            debug(`Using page routes from pages plugin:`, pagesScanResult.routes.length)

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
            import { superjson } from '#singletons/superjson'

            export const PROJECT_DATA = superjson.parse('${projectDataCode}')
          `

            return content
          },
        },
      ),
    },
  ]
}
