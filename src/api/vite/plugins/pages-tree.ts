import type { Config } from '#api/config/index'
import { polenVirtual } from '#api/vite/vi'
import type { Vite } from '#dep/vite/index'
import { reportDiagnostics } from '#lib/file-router/diagnostic-reporter'
import { FileRouter } from '#lib/file-router/index'
import { ViteVirtual } from '#lib/vite-virtual/index'
import { debug } from '#singletons/debug'
import mdx from '@mdx-js/rollup'
import { Path, Str } from '@wollybeard/kit'
import remarkGfm from 'remark-gfm'

const _debug = debug.sub(`vite-plugin-pages-tree`)

export const viProjectPages = polenVirtual([`project`, `pages.jsx`], { allowPluginProcessing: true })

export interface PagesTreePluginOptions {
  config: Config.Config
  onPagesChange?: (pages: FileRouter.ScanResult) => void
  onTreeChange?: (tree: FileRouter.RouteTreeNode) => void
}

/**
 * Pages plugin with tree support
 */
export const createPagesTreePlugin = (
  { config, onPagesChange, onTreeChange }: PagesTreePluginOptions,
): Vite.Plugin[] => {
  // State management
  let pagesCache: FileRouter.ScanResult | null = null
  let treeCache: FileRouter.RouteTreeNode | null = null

  // Helper functions
  const scanPages = async () => {
    if (!pagesCache) {
      _debug(`Scanning pages - cache is null, loading fresh data`)
      pagesCache = await FileRouter.scan({
        dir: config.paths.project.absolute.pages,
        glob: `**/*.{md,mdx}`,
      })
      _debug(`Found ${String(pagesCache.routes.length)} pages`)
    } else {
      _debug(`Using cached pages`)
    }
    return pagesCache
  }

  const scanTree = async () => {
    if (!treeCache) {
      _debug(`Scanning tree - cache is null, loading fresh data`)
      const result = await FileRouter.scanTree({
        dir: config.paths.project.absolute.pages,
        glob: `**/*.{md,mdx}`,
      })
      treeCache = result.routeTree
      _debug(`Built route tree`)
    } else {
      _debug(`Using cached tree`)
    }
    return treeCache
  }

  const clearCache = () => {
    _debug(`Clearing pages and tree cache`)
    pagesCache = null
    treeCache = null
  }

  const isPageFile = (file: string) => {
    return (file.endsWith(`.md`) || file.endsWith(`.mdx`))
      && file.includes(config.paths.project.absolute.pages)
  }

  const generatePagesModule = (pagesScanResult: FileRouter.ScanResult): string => {
    const $ = {
      pages: `pages`,
    }

    const s = Str.Builder()
    s`export const ${$.pages} = []`

    // Generate imports and route objects
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
  }

  return [
    // Plugin 1: MDX Processing
    {
      enforce: `pre` as const,
      ...mdx({
        jsxImportSource: `polen/react`,
        remarkPlugins: [remarkGfm],
      }),
    },

    // Plugin 2: Pages Management
    {
      name: `polen:pages-tree`,

      // Dev server configuration
      configureServer(server) {
        // Add pages directory to watcher
        _debug(`Adding pages directory to watcher:`, config.paths.project.absolute.pages)
        server.watcher.add(config.paths.project.absolute.pages)
      },

      // Hot update handling
      async handleHotUpdate({ file, server }) {
        if (!isPageFile(file)) return

        _debug(`Page file changed:`, file)

        // Clear cache
        clearCache()

        // Invalidate virtual module
        const mod = server.moduleGraph.getModuleById(viProjectPages.resolved)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          _debug(`Invalidated pages virtual module`)
        }

        // Notify about pages change (for other plugins that depend on pages)
        if (onPagesChange) {
          const pages = await scanPages()
          // Report any diagnostics
          reportDiagnostics(pages.diagnostics)
          onPagesChange(pages)
        }

        // Notify about tree change
        if (onTreeChange) {
          const tree = await scanTree()
          onTreeChange(tree)
        }

        // Trigger full reload
        server.ws.send({ type: `full-reload` })

        return []
      },

      // Virtual module handling
      ...ViteVirtual.IdentifiedLoader.toHooks({
        identifier: viProjectPages,
        async loader() {
          _debug(`Loading viProjectPages virtual module`)
          const pagesScanResult = await scanPages()
          const tree = await scanTree()

          // Report any diagnostics
          reportDiagnostics(pagesScanResult.diagnostics)

          // Notify about pages (useful for initial load)
          onPagesChange?.(pagesScanResult)
          onTreeChange?.(tree)

          return generatePagesModule(pagesScanResult)
        },
      }),
    },
  ]
}

// Helper to get tree
export const getRouteTree = async (config: Config.Config): Promise<FileRouter.RouteTreeNode> => {
  const result = await FileRouter.scanTree({
    dir: config.paths.project.absolute.pages,
    glob: `**/*.{md,mdx}`,
  })
  return result.routeTree
}
