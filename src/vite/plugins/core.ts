import { Api } from '#api/$'
import { VitePluginSelfContainedMode } from '#cli/_/self-contained-mode'
import type { ReactRouter } from '#dep/react-router/index'
import type { Vite } from '#dep/vite/index'
import { Json, Str } from '@wollybeard/kit'
import { fileURLToPath } from 'node:url'
import { polenVirtual } from '../vi.js'
import { Config as ConfigPlugin, viProjectConfig } from './config.js'
import { Examples } from './examples.js'
import { Hooks, viProjectHooks } from './hooks.js'
import { Navbar, viProjectNavbar } from './navbar.js'
import { Pages, viProjectRoutes } from './pages.js'
import { Schemas, viProjectSchema } from './schemas.js'

export interface ProjectRoutesModule {
  routes: ReactRouter.RouteObject[]
}

export const Core = (config: Api.Config.Config): Vite.PluginOption[] => {
  const conditionalPlugins: Vite.Plugin[] = []

  // Note: The main use for this right now is to resolve the react imports
  // from the mdx vite plugin which have to go through the Polen exports since Polen keeps those deps bundled.
  //
  // If we manage to get the mdx vite plugin that defers JSX transform to Rolldown then we can remove this!
  //
  if (config.advanced.isSelfContainedMode) {
    conditionalPlugins.push(VitePluginSelfContainedMode({
      projectDirPathExp: config.paths.project.rootDir,
    }))
  }

  // Create all plugins with their self-contained readers
  const schemasArea = Schemas({
    config,
    dependentVirtualModules: [viProjectConfig, viProjectNavbar],
  })
  const pagesArea = Pages({
    config,
    dependentVirtualModules: [viProjectNavbar, viProjectConfig, viProjectRoutes],
  })
  const examplesArea = Examples({
    config,
    schemaReader: schemasArea.reader,
    dependentVirtualModules: [viProjectConfig, viProjectNavbar],
  })
  const configPlugin = ConfigPlugin({
    config,
    schemaReader: schemasArea.reader,
    examplesReader: examplesArea.reader,
  })
  const navbarPlugin = Navbar({
    config,
    schemaReader: schemasArea.reader,
    examplesReader: examplesArea.reader,
    pagesReader: pagesArea.reader,
  })

  const hooksPlugin = Hooks({ config })

  return [
    ...conditionalPlugins,
    ...examplesArea.plugins,
    ...schemasArea.plugins,
    ...pagesArea.plugins,
    configPlugin,
    navbarPlugin,
    hooksPlugin,
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
    },
  ]
}
