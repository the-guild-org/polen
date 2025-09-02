import { Content } from '#api/content/$'
import { createNavbar, type NavbarItem } from '#api/content/navbar'
import { Examples } from '#api/examples/$'
import { Api } from '#api/index'
import { Schema } from '#api/schema/$'
import { VitePluginSelfContainedMode } from '#cli/_/self-contained-mode'
import type { ReactRouter } from '#dep/react-router/index'
import type { Vite } from '#dep/vite/index'
import { Catalog } from '#lib/catalog/$'
import { ViteVirtual } from '#lib/vite-virtual'
import type { ProjectData } from '#project-data'
import { debugPolen } from '#singletons/debug'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Json, Str } from '@wollybeard/kit'
import { Effect } from 'effect'
import * as FS from 'node:fs/promises'
import * as Path from 'node:path'
import { fileURLToPath } from 'node:url'
import { polenVirtual } from '../vi.js'
import { Pages } from './pages.js'
import { SchemaAssets } from './schema-assets.js'

const viTemplateVariables = polenVirtual([`template`, `variables`])
const viTemplateSchemaAugmentations = polenVirtual([`template`, `schema-augmentations`])
const viTemplateHomeConfig = polenVirtual([`template`, `home-config`])
const viProjectExamples = polenVirtual([`project`, `examples`])
export const viProjectData = polenVirtual([`project`, `data.json`], { allowPluginProcessing: true })
export const viProjectSchema = polenVirtual([`project`, `schema.json`], { allowPluginProcessing: true })
export const viProjectHooks = polenVirtual([`project`, `hooks`], { allowPluginProcessing: true })

export interface ProjectRoutesModule {
  routes: ReactRouter.RouteObject[]
}

export const Core = (config: Api.Config.Config): Vite.PluginOption[] => {
  let loadedCatalogCache: Api.Schema.InputSource.LoadedCatalog | null = null

  const readSchema = async () => {
    if (loadedCatalogCache === null) {
      const loadedCatalog = await Effect.runPromise(
        Schema.loadOrNull(config).pipe(
          Effect.provide(NodeFileSystem.layer),
        ),
      )
      loadedCatalogCache = loadedCatalog
    }
    return loadedCatalogCache
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
    SchemaAssets(config),
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
      enforce: `pre` as const,
      resolveId(id, importer) {
        // const debug = debugPolen.sub(`vite-plugin:internal-import-alias`)

        const isPolenImporter = Boolean(
          importer
            && (
              importer.startsWith(config.paths.framework.sourceDir)
              || polenVirtual.includes(importer)
              || (importer.startsWith(config.paths.framework.rootDir) && importer.endsWith(`index.html`))
            ),
        )

        if (!isPolenImporter) return null
        // debug(`check candidate`, { id, importer, isPolenImporter })

        const find = Str.pattern<{ groups: [`path`] }>(/^#(?<path>.+)/)
        const match = Str.match(id, find)
        if (!match) return null

        // Use Node's resolver to handle package.json imports correctly
        try {
          const resolved = import.meta.resolve(id)
          const to = fileURLToPath(resolved)
          // debug(`did resolve`, { from: id, to })
          return to
        } catch {
          // If resolution fails, return null to let other resolvers handle it
          return null
        }
      },
    },
    ...Pages({ config }),
    {
      name: `polen:core`,
      config(_, { command }) {
        return {
          root: config.paths.framework.rootDir,
          publicDir: config.paths.project.absolute.public.root,
          // todo
          // future: {
          //   removePluginHookHandleHotUpdate: 'warn',
          //   removePluginHookSsrArgument: 'warn',
          //   removeServerModuleGraph: 'warn',
          //   removeServerHot: 'warn',
          //   removeServerTransformRequest: 'warn',
          //   removeSsrLoadModule: 'warn',
          // },
          define: {
            __BUILDING__: Json.encode(command === `build`),
            __SERVING__: Json.encode(command === `serve`),
            __COMMAND__: Json.encode(command),
            __BUILD_ARCHITECTURE__: Json.encode(config.build.architecture),
            __BUILD_ARCHITECTURE_SSG__: Json.encode(config.build.architecture === `ssg`),
            'process.env.NODE_ENV': Json.encode(config.advanced.debug ? 'development' : 'production'),
          },
          // customLogger: createLogger(config),
          build: {
            target: `esnext`,
            assetsDir: config.paths.project.relative.build.relative.assets.root,
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
          identifier: viProjectSchema,
          async loader() {
            const debug = debugPolen.sub(`module-project-schema`)
            debug(`load`, { id: viProjectSchema.id })

            const schemaResult = await readSchema()
            if (!schemaResult || !schemaResult.data) {
              return `export default null`
            }

            // Encode the catalog to convert GraphQLSchema to AST before serializing

            const encodedCatalog = await Effect.runPromise(Catalog.encode(schemaResult.data))

            return `export default ${JSON.stringify(encodedCatalog)}`
          },
        },
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
            const s = `export const schemaAugmentations = ${JSON.stringify(config.schema?.augmentations ?? [])}`
            return s
          },
        },
        {
          identifier: viTemplateHomeConfig,
          loader() {
            // Home config should already be normalized in the config layer
            const s = `export const homeConfig = ${JSON.stringify(config.home)}`
            return s
          },
        },
        {
          identifier: viProjectData,
          async loader() {
            const debug = debugPolen.sub(`module-project-data`)

            debug(`load`, { id: viProjectData.id })

            const loadedCatalog = await readSchema()

            const navbar: NavbarItem[] = []

            // ━ Schema presence causes adding some navbar items
            if (loadedCatalog?.data) {
              // IMPORTANT: Always ensure paths start with '/' for React Router compatibility.
              // Without the leading slash, React Router treats paths as relative, which causes
              // hydration mismatches between SSR (where base path is prepended) and client
              // (where basename is configured). This ensures consistent behavior.
              const referencePath = Api.Schema.Routing.createReferenceBasePath()
              navbar.push({ pathExp: referencePath, title: `Reference`, position: 'left' })
              // Check if we have revisions to show changelog
              const catalog = loadedCatalog.data as Catalog.Catalog
              const hasMultipleRevisions = Catalog.fold(
                (versioned) => {
                  // For versioned catalogs, count total revisions across all entries
                  const totalRevisions = versioned.entries.reduce(
                    (sum: number, entry) => sum + entry.revisions.length,
                    0,
                  )
                  return totalRevisions > 1
                },
                (unversioned) => unversioned.schema.revisions?.length > 1,
              )(catalog)

              if (hasMultipleRevisions) {
                navbar.push({ pathExp: `/changelog`, title: `Changelog`, position: 'right' })
              }
            }

            //
            // ━━ Scan pages and add to navbar
            //

            const pagesDir = config.paths.project.absolute.pages
            const scanResult = await Effect.runPromise(
              Content.scan({ dir: pagesDir }).pipe(
                Effect.provide(NodeFileSystem.layer),
              ),
            )
            const data = createNavbar(scanResult.list)
            navbar.push(...data)

            //
            // ━━ Put It All together
            //

            const projectData: ProjectData = {
              basePath: config.build.base,
              paths: config.paths,
              navbar, // Complete navbar with schema and pages
              server: config.server,
              warnings: config.warnings,
            }

            // Return a JavaScript module that exports the data
            return `export default ${JSON.stringify(projectData)}`
          },
        },
        {
          identifier: viProjectHooks,
          async loader() {
            const fs = await import('node:fs/promises')
            const path = await import('node:path')

            const hooksPathTs = path.join(config.paths.project.rootDir, 'hooks.ts')
            const hooksPathTsx = path.join(config.paths.project.rootDir, 'hooks.tsx')

            let hooksPath = null
            try {
              await fs.access(hooksPathTsx)
              hooksPath = hooksPathTsx
            } catch {
              try {
                await fs.access(hooksPathTs)
                hooksPath = hooksPathTs
              } catch {
                // No hooks file found
              }
            }

            if (!hooksPath) {
              return `export const navbar = null`
            }

            return `export * from '${hooksPath}'`
          },
        },
      ),
    },
  ]
}
