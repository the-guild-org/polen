import type { Config } from '#api/config/index'
import type { ReactRouter } from '#dep/react-router/index'
import type { Vite } from '#dep/vite/index'
import { ViteVirtual } from '#lib/vite-virtual/index'
import { pandacss } from '@pandacss/dev/postcss'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'
// import { createLogger } from '../logger.js'
import { polenVirtual } from '../vi.js'

const viTemplateVariables = polenVirtual([`template`, `variables`])

export interface ProjectRoutesModule {
  routes: ReactRouter.RouteObject[]
}

export interface Options {
  config: Config.Config
}

export const Core = ({ config }: Options): Vite.PluginOption[] => {
  const plugins: Vite.Plugin[] = []

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
    // {
    //   name: `polen:internal-import-alias`,
    //   enforce: `pre` as const,
    //   resolveId(id, importer) {
    //     // const debug = debugPolen.sub(`vite-plugin:internal-import-alias`)

    //     const isPolenImporter = Boolean(
    //       importer
    //         && (
    //           importer.startsWith(config.paths.framework.sourceDir)
    //           || polenVirtual.includes(importer)
    //           || (importer.startsWith(config.paths.framework.rootDir) && importer.endsWith(`index.html`))
    //         ),
    //     )

    //     if (!isPolenImporter) return null
    //     // debug(`check candidate`, { id, importer, isPolenImporter })

    //     const find = Str.pattern<{ groups: [`path`] }>(/^#(?<path>.+)/)
    //     const match = Str.match(id, find)
    //     if (!match) return null

    //     const to = `${config.paths.framework.sourceDir}/${match.groups.path}${config.paths.framework.sourceExtension}`
    //     // debug(`did resolve`, { from: id, to })

    //     return to
    //   },
    // },
    {
      name: `polen:core`,

      config() {
        return {
          future: {
            removePluginHookHandleHotUpdate: 'warn',
            removePluginHookSsrArgument: 'warn',
            removeServerModuleGraph: 'warn',
            removeServerHot: 'warn',
            removeServerTransformRequest: 'warn',
            removeSsrLoadModule: 'warn',
          },
          root: config.paths.framework.rootDir,
          // customLogger: createLogger(config),
          // todo: do we really need to set this to false?
          esbuild: false,
          css: {
            transformer: 'lightningcss',
            lightningcss: {
              targets: browserslistToTargets(browserslist(['>= 0.25%', 'not dead'])),
            },
            postcss: {
              plugins: [
                pandacss() as any, // Type mismatch: Panda CSS uses PostCSS 8.4.49, Vite uses 8.5.6
              ],
            },
          },
          build: {
            target: `esnext`,
            assetsDir: config.paths.project.relative.build.relative.assets,
            cssMinify: 'lightningcss',
            rollupOptions: {
              treeshake: {
                // Aggressive tree-shaking for smallest bundles
                moduleSideEffects: false, // Only include code if an export is actually used
                annotations: true, // Respect @__PURE__ annotations for better dead code elimination
                unknownGlobalSideEffects: false, // Assume global functions don't have side effects
              },
            },
            minify: !config.advanced.debug,
            emptyOutDir: true, // disables warning that build dir not in root dir; expected b/c root dir = framework package
          },
        }
      },
      configEnvironment(name, _config, _env) {
        if (name === 'ssr' || name === 'rsc') {
          return {
            optimizeDeps: {
              include: ['@radix-ui/themes'],
            },
          }
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
      ),
    },
  ]
}
