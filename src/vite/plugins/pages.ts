import type { Api } from '#api/$'
import { Content } from '#api/content/$'
import type { Vite } from '#dep/vite/index'
import { Diagnostic } from '#lib/diagnostic/$'
import { FileRouter } from '#lib/file-router'
import { ViteReactive } from '#lib/vite-reactive/$'
import { createAssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import { debugPolen } from '#singletons/debug'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import mdx from '@mdx-js/rollup'
import { Arr, Path, Str } from '@wollybeard/kit'
import { Effect } from 'effect'
import { polenVirtual } from '../vi.js'
import { viProjectData } from './core.js'

export const viProjectRoutes = polenVirtual([`project`, `routes.jsx`], { allowPluginProcessing: true })
export const viProjectPagesCatalog = polenVirtual([`project`, `data`, `pages-catalog.js`], {
  allowPluginProcessing: true,
})

export interface Options {
  config: Api.Config.Config
}

export interface ProjectPagesCatalog {
  sidebarIndex: Content.SidebarIndex
  pages: Content.Page[]
}

/**
 * Pages plugin with tree support
 */
export const Pages = ({
  config,
}: Options) => {
  const debug = debugPolen.sub(`vite-pages`)
  const reader = createAssetReader(() =>
    Content.scan({
      dir: config.paths.project.absolute.pages,
    })
  )

  const generateRoutesModule = (pages: Content.Page[]): string => {
    const $ = {
      routes: `routes`,
    }

    const s = Str.Builder()
    s`export const ${$.routes} = []`

    // Generate imports and route objects
    for (const { route, metadata } of pages) {
      const filePathExp = Path.format(route.file.path.absolute)
      const pathExp = FileRouter.routeToPathExpression(route)
      const $$ = {
        ...$,
        Component: Str.Case.camel(`page ` + Str.titlizeSlug(pathExp)),
      }

      s`
        import ${$$.Component} from '${filePathExp}'

        ${$$.routes}.push({
          path: '${pathExp}',
          Component: ${$$.Component},
          metadata: ${JSON.stringify(metadata)}
        })
      `
    }

    return s.render()
  }

  const plugins: Vite.Plugin[] = [
    // Plugin 1: MDX Processing
    {
      enforce: `pre` as const,
      ...mdx(Content.getMdxRollupConfig()),
    },

    // Plugin 2: Reactive Pages Management
    ViteReactive.ReactiveAssetPlugin({
      name: 'pages',
      reader,
      filePatterns: {
        watch: [config.paths.project.absolute.pages],
        isRelevant: (file) => Content.isPageFile(file, config.paths.project.absolute.pages),
      },
      dependentVirtualModules: [viProjectRoutes, viProjectPagesCatalog, viProjectData],
      hooks: {
        async shouldFullReload(oldData, newData) {
          // Check if the visible pages list changed
          const pageStructureChanged = !oldData || !Arr.equalShallowly(
            oldData.list.map(p => Path.format(p.route.file.path.absolute)),
            newData.list.map(p => Path.format(p.route.file.path.absolute)),
          )
          // Return true for full reload only if structure changed
          return pageStructureChanged
        },
        async onDiagnostics(data) {
          Diagnostic.report(data.diagnostics)
        },
      },
    }),

    // Plugin 3: Pages Virtual Module
    {
      name: `polen:pages-virtual`,
      resolveId(id: string) {
        if (id === viProjectPagesCatalog.id) {
          return viProjectPagesCatalog.resolved
        }
      },
      load: {
        async handler(id: string) {
          if (id !== viProjectPagesCatalog.resolved) return
          debug(`hook load`)

          const loadedPages = await Effect.runPromise(
            reader.read().pipe(Effect.provide(NodeFileSystem.layer)),
          )
          Diagnostic.report(loadedPages.diagnostics)
          debug(`found visible`, { count: loadedPages.list.length })

          //
          // ━━ Build Sidebar
          //

          const sidebarIndex = Content.buildSidebarIndex(loadedPages)

          //
          // ━━ Put It All together
          //

          const projectPagesCatalog: ProjectPagesCatalog = {
            sidebarIndex,
            pages: loadedPages.list,
          }

          return `export default ${JSON.stringify(projectPagesCatalog)}`
        },
      },
    },
    // Plugin 3: Virtual Module for React Router Routes
    {
      name: `polen:routes`,
      resolveId(id: string) {
        if (id === viProjectRoutes.id) {
          return viProjectRoutes.resolved
        }
      },
      load: {
        handler: async (id: string) => {
          if (id !== viProjectRoutes.resolved) return

          debug(`Loading viProjectRoutes virtual module`)

          const scanResult = await Effect.runPromise(
            reader.read().pipe(Effect.provide(NodeFileSystem.layer)),
          )
          Diagnostic.report(scanResult.diagnostics)
          const code = generateRoutesModule(scanResult.list)

          // Generate the module code
          return {
            code,
            moduleType: `js`,
          }
        },
      },
    },
  ]

  return { plugins, reader }
}
