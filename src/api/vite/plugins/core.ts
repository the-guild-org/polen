import type { Config } from '#api/config/index'
import { NavbarData } from '#api/vite/data/navbar'
import { VitePluginSelfContainedMode } from '#cli/_/self-contained-mode'
import type { ReactRouter } from '#dep/react-router/index'
import type { Vite } from '#dep/vite/index'
import { VitePluginJson } from '#lib/vite-plugin-json/index'
import { VitePluginReactiveData } from '#lib/vite-plugin-reactive-data/index'
import { ViteVirtual } from '#lib/vite-virtual/index'
import { debug } from '#singletons/debug'
import { superjson } from '#singletons/superjson'
import { Json, Str } from '@wollybeard/kit'
import type { ProjectData } from '../../../project-data.ts'
import { SchemaAugmentation } from '../../schema-augmentation/index.ts'
import { Schema } from '../../schema/index.ts'
import { createLogger } from '../logger.ts'
import { polenVirtual } from '../vi.ts'
import { Pages } from './pages.ts'

const _debug = debug.sub(`vite-plugin-core`)

const viTemplateVariables = polenVirtual([`template`, `variables`])
const viTemplateSchemaAugmentations = polenVirtual([`template`, `schema-augmentations`])
const viProjectData = polenVirtual([`project`, `data.superjson`], { allowPluginProcessing: true })

export interface ProjectPagesModule {
  pages: ReactRouter.RouteObject[]
}

export const Core = (config: Config.Config): Vite.PluginOption[] => {
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
  const navbarData = NavbarData()

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

  const json = VitePluginJson.create({
    codec: {
      validate: superjson,
      importPath: import.meta.resolve('#singletons/superjson'),
      importExport: 'superjson',
    },
    filter: {
      moduleTypes: ['superjson'],
    },
  })

  return [
    ...plugins,
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
      enforce: 'pre' as const,
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
    json,
    VitePluginReactiveData.create({
      moduleId: `virtual:polen/project/data/navbar`,
      data: navbarData.value,
      codec: superjson,
      name: `polen-navbar`,
      moduleType: 'superjson',
    }),
    ...Pages({
      config,
      navbarData,
    }),
    {
      name: `polen:core`,
      config(_, { command }) {
        // isServing = command === `serve`
        return {
          root: config.paths.framework.rootDir,
          define: {
            __BUILDING__: Json.encode(command === `build`),
            __SERVING__: Json.encode(command === `serve`),
            __COMMAND__: Json.encode(command),
            __BUILD_ARCHITECTURE__: Json.encode(config.build.architecture),
            __BUILD_ARCHITECTURE_SSG__: Json.encode(config.build.architecture === `ssg`),
          },
          customLogger: createLogger(config),
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
            _debug(`loadingViProjectDataVirtualModule`)
            const schema = await readSchema()

            // ━ Schema presence causes adding some navbar items
            const schemaNavbar = navbarData.get('schema')
            schemaNavbar.length = 0 // Clear existing
            if (schema) {
              schemaNavbar.push({ pathExp: `reference`, title: `Reference` })
              if (schema.versions.length > 1) {
                schemaNavbar.push({ pathExp: `changelog`, title: `Changelog` })
              }
            }

            //
            // ━━ Put It All together
            //

            const projectData: ProjectData = {
              schema,
              faviconPath: `/logo.svg`,
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

            return {
              code: superjson.stringify(projectData),
              moduleType: 'superjson',
            }
          },
        },
      ),
    },
  ]
}
