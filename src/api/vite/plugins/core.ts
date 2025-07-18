import type { Config } from '#api/config/index'
import { Content } from '#api/content/$'
import { createNavbar, type NavbarItem } from '#api/content/navbar'
import { Api } from '#api/index'
import { VitePluginSelfContainedMode } from '#cli/_/self-contained-mode'
import type { ReactRouter } from '#dep/react-router/index'
import type { Vite } from '#dep/vite/index'
import { VitePluginJson } from '#lib/vite-plugin-json'
import { ViteVirtual } from '#lib/vite-virtual'
import { debugPolen } from '#singletons/debug'
import { superjson } from '#singletons/superjson'
import { Json, Str } from '@wollybeard/kit'
import { fileURLToPath } from 'node:url'
import type { ProjectData } from '../../../project-data.js'
import { SchemaAugmentation } from '../../schema-augmentation/index.js'
import { Schema } from '../../schema/index.js'
import { polenVirtual } from '../vi.js'
import { Pages } from './pages.js'
import { SchemaAssets } from './schema-assets.js'

const viTemplateVariables = polenVirtual([`template`, `variables`])
const viTemplateSchemaAugmentations = polenVirtual([`template`, `schema-augmentations`])
export const viProjectData = polenVirtual([`project`, `data.jsonsuper`], { allowPluginProcessing: true })
export const viProjectSchema = polenVirtual([`project`, `schema.jsonsuper`], { allowPluginProcessing: true })
export const viProjectHooks = polenVirtual([`project`, `hooks`], { allowPluginProcessing: true })

export interface ProjectRoutesModule {
  routes: ReactRouter.RouteObject[]
}

export const Core = (config: Config.Config): Vite.PluginOption[] => {
  let schemaCache: Awaited<ReturnType<typeof Schema.readOrThrow>> | null = null

  const readSchema = async () => {
    if (schemaCache === null) {
      const schemaResult = await Schema.readOrThrow({
        ...config.schema,
        projectRoot: config.paths.project.rootDir,
      })
      // todo: augmentations scoped to a version
      schemaResult.data?.forEach(version => {
        if (version.after) {
          SchemaAugmentation.apply(version.after.data, config.schemaAugmentations)
        }
      })
      schemaCache = schemaResult
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

  const jsonsuper = VitePluginJson.create({
    codec: {
      validate: superjson,
      importPath: `#singletons/superjson`,
      importExport: `superjson`,
    },
    filter: {
      moduleTypes: [`jsonsuper`],
    },
  })

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
    jsonsuper,
    ...Pages({
      config,
    }),
    {
      name: `polen:core`,
      config(_, { command }) {
        return {
          root: config.paths.framework.rootDir,
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
          esbuild: false,
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
            return superjson.stringify(schemaResult.data)
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
            const s = `export const schemaAugmentations = ${JSON.stringify(config.schemaAugmentations)}`
            return s
          },
        },
        {
          identifier: viProjectData,
          async loader() {
            const debug = debugPolen.sub(`module-project-data`)

            debug(`load`, { id: viProjectData.id })

            const schemaResult = await readSchema()

            const navbar: NavbarItem[] = []

            // ━ Schema presence causes adding some navbar items
            if (schemaResult.data) {
              // IMPORTANT: Always ensure paths start with '/' for React Router compatibility.
              // Without the leading slash, React Router treats paths as relative, which causes
              // hydration mismatches between SSR (where base path is prepended) and client
              // (where basename is configured). This ensures consistent behavior.
              const referencePath = Api.Schema.Routing.createReferenceBasePath()
              navbar.push({ pathExp: referencePath, title: `Reference`, position: 'left' })
              if (schemaResult.data.length > 1) {
                navbar.push({ pathExp: `/changelog`, title: `Changelog`, position: 'right' })
              }
            }

            //
            // ━━ Scan pages and add to navbar
            //

            const pagesDir = config.paths.project.absolute.pages
            const scanResult = await Content.scan({ dir: pagesDir })
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

            // Return just the JSON string - let the JSON plugin handle the transformation
            return superjson.stringify(projectData)
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
