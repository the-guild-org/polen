import type { Api } from '#api/$'
import { Content } from '#api/content/$'
import type { LoadedCatalog } from '#api/schema/input-source/load'
import { Ef } from '#dep/effect'
import type { Vite } from '#dep/vite/index'
import { Diagnostic } from '#lib/diagnostic/$'
import { FileRouter } from '#lib/file-router'
import { ViteReactive } from '#lib/vite-reactive/$'
import { createAssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import type { AssetReader } from '#lib/vite-reactive/reactive-asset-plugin'
import type { ViteVirtual } from '#lib/vite-virtual/$'
import { debugPolen } from '#singletons/debug'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import mdx from '@mdx-js/rollup'
import { FsLoc, Str } from '@wollybeard/kit'
import { polenVirtual } from '../vi.js'
import { MdxSchemaBridge } from './mdx-schema-bridge.js'

export const viProjectRoutes = polenVirtual([`project`, `routes.jsx`], { allowPluginProcessing: true })

export const viProjectPages = polenVirtual([`project`, `pages`], {
  allowPluginProcessing: true,
})

export interface Options {
  config: Api.Config.Config
  dependentVirtualModules?: ViteVirtual.Identifier.Identifier[]
  schemaReader?: AssetReader<LoadedCatalog | null, any, any>
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
  dependentVirtualModules = [],
  schemaReader,
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
      const filePathExp = FsLoc.encodeSync(route.file.path.absolute)
      const pathExp = route.toString()
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

  const mdxPlugin = mdx(Content.getMdxRollupConfig({
    enableGraphQLReferences: !!schemaReader,
    onDiagnostic: (diagnostic) => {
      // Report diagnostics through Polen's diagnostic system
      Diagnostic.report([diagnostic])
    },
  }))

  const plugins: Vite.Plugin[] = [
    // Add schema bridge plugin if schema reader is available
    ...(schemaReader ? [MdxSchemaBridge({ schemaReader })] : []),

    // Plugin 1: MDX Processing with GraphQL references enabled
    {
      ...mdxPlugin,
      enforce: `pre` as const,
    } as Vite.Plugin,

    // Plugin 2: Reactive Pages Management
    ViteReactive.ReactiveAssetPlugin({
      name: 'pages',
      reader,
      filePatterns: {
        watch: [FsLoc.encodeSync(config.paths.project.absolute.pages)],
        isRelevant: (file) => Content.isPageFile(file, FsLoc.encodeSync(config.paths.project.absolute.pages)),
      },
      dependentVirtualModules: [
        viProjectPages,
        ...dependentVirtualModules,
      ],
      hooks: {
        async shouldFullReload(oldData, newData) {
          // Check if the visible pages list changed
          const oldPaths = oldData?.list.map(p => FsLoc.encodeSync(p.route.file.path.absolute)) || []
          const newPaths = newData.list.map(p => FsLoc.encodeSync(p.route.file.path.absolute))
          const pageStructureChanged = !oldData
            || oldPaths.length !== newPaths.length
            || !oldPaths.every((path, i) => path === newPaths[i])
          // Return true for full reload only if structure changed
          return pageStructureChanged
        },
        async onDiagnostics(data) {
          Diagnostic.report(data.diagnostics)
        },
      },
    }) as Vite.Plugin,

    // Plugin 3: Pages Virtual Module
    {
      name: `polen:pages-virtual`,
      resolveId(id: string) {
        if (id === viProjectPages.id) {
          return viProjectPages.resolved
        }
      },
      load: {
        async handler(id: string) {
          if (id !== viProjectPages.resolved) return
          debug(`hook load`)

          const loadedPages = await Ef.runPromise(
            reader.read().pipe(Ef.provide(NodeFileSystem.layer)),
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

          return `export const pagesCatalog = ${JSON.stringify(projectPagesCatalog)}`
        },
      },
    } as Vite.Plugin,
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

          const scanResult = await Ef.runPromise(
            reader.read().pipe(Ef.provide(NodeFileSystem.layer)),
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
    } as Vite.Plugin,
  ]

  return { plugins, reader }
}
