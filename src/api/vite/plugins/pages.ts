import type { Config } from '#api/config/index'
import { polenVirtual } from '#api/vite/vi'
import type { Vite } from '#dep/vite/index'
import { reportDiagnostics } from '#lib/file-router/diagnostic-reporter'
import { FileRouter } from '#lib/file-router/index'
import type { NavbarRegistry } from '#lib/navbar-registry/index'
import { Tree } from '#lib/tree/index'
import { debug } from '#singletons/debug'
import { superjson } from '#singletons/superjson'
import mdx from '@mdx-js/rollup'
import { Path, Str } from '@wollybeard/kit'
import remarkGfm from 'remark-gfm'

const _debug = debug.sub(`vite-plugin-pages`)

export const viProjectPages = polenVirtual([`project`, `pages.jsx`], { allowPluginProcessing: true })
export const viProjectPagesData = polenVirtual([`project`, `data`, 'pages.superjson'], { allowPluginProcessing: true })

export interface PagesTreePluginOptions {
  config: Config.Config
  navbarRegistry?: NavbarRegistry
  onPagesChange?: (pages: FileRouter.ScanResult) => void
  onTreeChange?: (tree: FileRouter.RouteTreeNode) => void
}

export interface ProjectDataPages {
  sidebarIndex: SidebarIndex
  pagesScanResult: FileRouter.ScanResult
}

export interface SidebarIndex {
  [pathExpression: string]: FileRouter.Sidebar.Sidebar
}

/**
 * Pages plugin with tree support
 */
export const Pages = ({
  config,
  navbarRegistry,
  onPagesChange,
  onTreeChange,
}: PagesTreePluginOptions): Vite.Plugin[] => {
  let currentPagesData: FileRouter.ScanResult | null = null
  let currentTreeData: FileRouter.RouteTreeNode | null = null

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
      name: `polen:pages`,

      // Dev server configuration
      configureServer(server) {
        // Add pages directory to watcher
        _debug(`configureServer: watch pages directory`, config.paths.project.absolute.pages)
        server.watcher.add(config.paths.project.absolute.pages)
      },

      // Hot update handling
      async handleHotUpdate({ file, server, modules }) {
        _debug(`handleHotUpdate`, file)
        if (!isPageFile(file)) return

        _debug(`Page file changed:`, file)

        // Check if this is a content-only change to an existing page
        const oldPages = pagesCache

        // Clear cache and rescan
        clearCache()
        const newPages = await scanPages()
        currentPagesData = newPages

        // Check if page structure changed (added/removed pages)
        const structureChanged = !oldPages
          || oldPages.routes.length !== newPages.routes.length
          || !oldPages.routes.every((oldRoute, i) =>
            oldRoute.file.path.absolute === newPages.routes[i]?.file.path.absolute
          )

        if (structureChanged) {
          _debug(`Page structure changed, triggering full reload`)

          // Invalidate virtual module
          const mod = server.moduleGraph.getModuleById(viProjectPages.id)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
            _debug(`Invalidated pages virtual module`)
          }

          // Notify about changes
          if (onPagesChange) {
            reportDiagnostics(newPages.diagnostics)
            onPagesChange(newPages)
          }

          if (onTreeChange) {
            const tree = await scanTree()
            onTreeChange(tree)
            currentTreeData = tree
          }

          // Trigger full reload for structure changes
          server.ws.send({ type: `full-reload` })
          return []
        } else {
          _debug(`Page content changed, allowing HMR`)
          // Let default HMR handle the MDX file change
          return modules
        }
      },
      resolveId(id) {
        if (id === viProjectPagesData.id) {
          return viProjectPagesData.resolved
        }
      },
      load: {
        // filter: {
        //   id: viProjectPagesData.resolved,
        // },
        async handler(id) {
          if (id !== viProjectPagesData.resolved) return
          _debug(`viProjectDataPages`)

          // Get pages data from the pages plugin or load initially
          if (!currentPagesData) {
            _debug(`loadingPagesDataInitially`)
            currentPagesData = await FileRouter.scan({
              dir: config.paths.project.absolute.pages,
              glob: `**/*.{md,mdx}`,
            })
            // Report any diagnostics from initial scan
            reportDiagnostics(currentPagesData.diagnostics)
          }
          if (!currentTreeData) {
            _debug(`loadingTreeDataInitially`)
            currentTreeData = await getRouteTree(config)
          }
          const pagesScanResult = currentPagesData
          const routeTree = currentTreeData
          _debug(`usingPageRoutesFromPagesPlugin`, pagesScanResult.routes.length)

          //
          // ━━ Build Navbar
          //

          // Update navbar registry if provided
          if (navbarRegistry) {
            const navbar = navbarRegistry.get('pages')
            navbar.length = 0 // Clear existing

            // Process first-level children as navigation items
            for (const child of routeTree.children) {
              if (child.value.type === 'directory') {
                // Check if this directory has an index file
                const hasIndex = child.children.some(c => c.value.type === 'file' && c.value.name === 'index')

                if (hasIndex) {
                  const pathExp = FileRouter.pathToExpression([child.value.name])
                  const title = Str.titlizeSlug(child.value.name)
                  navbar.push({
                    pathExp: pathExp.startsWith('/') ? pathExp.slice(1) : pathExp,
                    title,
                  })
                }
              } else if (child.value.type === 'file' && child.value.name !== 'index') {
                const pathExp = FileRouter.pathToExpression([child.value.name])
                const title = Str.titlizeSlug(child.value.name)
                navbar.push({
                  pathExp: pathExp.startsWith('/') ? pathExp.slice(1) : pathExp,
                  title,
                })
              }
            }
          }

          //
          // ━━ Build Sidebar
          //

          const sidebarIndex: SidebarIndex = {}

          // Build sidebar for each top-level directory
          for (const child of routeTree.children) {
            if (child.value.type === 'directory') {
              const pathExp = `/${child.value.name}`
              // Create a subtree starting from this directory
              const subtree = Tree.node(child.value, child.children)
              // Pass the directory name as base path so paths are built correctly
              const sidebar = FileRouter.Sidebar.buildFromTree(subtree, [child.value.name])
              _debug(`Built sidebar for ${pathExp}:`, sidebar)
              sidebarIndex[pathExp] = sidebar
            }
          }

          //
          // ━━ Put It All together
          //

          const projectDataPages: ProjectDataPages = {
            sidebarIndex,
            pagesScanResult: pagesScanResult,
          }

          return {
            code: superjson.stringify(projectDataPages),
            moduleType: 'superjson',
          }
        },
      },
    },
    // Plugin 4: Virtual Module for Pages Routes
    {
      name: 'polen:pages:routes',
      resolveId(id) {
        if (id === viProjectPages.id) {
          return viProjectPages.resolved
        }
      },
      load: {
        // filter: {
        //   id: viProjectPages.resolved,
        // },
        handler: async (id) => {
          if (id !== viProjectPages.resolved) return

          _debug(`Loading viProjectPages virtual module`)

          // Ensure we have pages data
          if (!currentPagesData) {
            currentPagesData = await scanPages()
            reportDiagnostics(currentPagesData.diagnostics)
          }

          // Generate the module code
          return {
            code: generatePagesModule(currentPagesData),
            moduleType: 'js',
          }
        },
      },
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
