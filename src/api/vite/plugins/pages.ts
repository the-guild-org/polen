import type { Config } from '#api/config/index'
import { Content } from '#api/content/$'
import { createNavbar } from '#api/content/navbar'
import type { NavbarDataRegistry } from '#api/vite/data/navbar'
import { polenVirtual } from '#api/vite/vi'
import type { Vite } from '#dep/vite/index'
import { reportDiagnostics } from '#lib/file-router/diagnostic-reporter'
import { FileRouter } from '#lib/file-router/index'
import { debugPolen } from '#singletons/debug'
import { superjson } from '#singletons/superjson'
import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import { Arr, Cache, Path, Str } from '@wollybeard/kit'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

const debug = debugPolen.sub(`vite-plugin-pages`)

export const viProjectRoutes = polenVirtual([`project`, `routes.jsx`], { allowPluginProcessing: true })
export const viProjectPagesCatalog = polenVirtual([`project`, `data`, 'pages-catalog.jsonsuper'], {
  allowPluginProcessing: true,
})

export interface Options {
  config: Config.Config
  navbarData?: NavbarDataRegistry
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
  navbarData,
}: Options): Vite.Plugin[] => {
  const scanPages = Cache.memoize(debug.trace(async function scanPages() {
    const result = await Content.scan({
      dir: config.paths.project.absolute.pages,
      glob: `**/*.{md,mdx}`,
    })
    return result
  }))

  const invalidateVirtualModules = (server: Vite.ViteDevServer) => {
    const routesModule = server.moduleGraph.getModuleById(viProjectRoutes.id)
    if (routesModule) {
      server.moduleGraph.invalidateModule(routesModule)
      debug(`Invalidated routes virtual module`)
    }

    const catalogModule = server.moduleGraph.getModuleById(viProjectPagesCatalog.id)
    if (catalogModule) {
      server.moduleGraph.invalidateModule(catalogModule)
      debug(`Invalidated pages catalog virtual module`)
    }
  }

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

  return [
    // Plugin 1: MDX Processing
    {
      enforce: `pre` as const,
      ...mdx({
        jsxImportSource: `polen/react`,
        remarkPlugins: [
          // Parse frontmatter blocks so they're removed from content
          remarkFrontmatter,
          remarkGfm,
        ],
        rehypePlugins: [
          [
            rehypeShiki,
            {
              themes: {
                light: `github-light`,
                dark: `tokyo-night`,
              },
              defaultColor: 'light',
              cssVariablePrefix: `--shiki-`,
              transformers: [
                // Line numbers will be handled via CSS
              ],
            },
          ],
        ],
      }),
    },

    // Plugin 2: Pages Management
    {
      name: `polen:pages`,

      // Dev server configuration
      configureServer(server) {
        // Add pages directory to watcher
        debug(`configureServer: watch pages directory`, config.paths.project.absolute.pages)
        server.watcher.add(config.paths.project.absolute.pages)

        // Handle file additions and deletions
        const handleFileStructureChange = async (file: string, event: 'add' | 'unlink') => {
          if (!Content.isPageFile(file, config.paths.project.absolute.pages)) return

          debug(`Page file ${event === 'add' ? 'added' : 'deleted'}:`, file)

          // Clear cache and rescan
          scanPages.clear()
          const newScanResult = await scanPages()

          // Invalidate virtual modules
          invalidateVirtualModules(server)

          // Report any diagnostics
          reportDiagnostics(newScanResult.diagnostics)

          // Trigger full reload to ensure routes are updated
          server.ws.send({ type: 'full-reload' })
        }

        server.watcher.on('add', (file) => handleFileStructureChange(file, 'add'))
        server.watcher.on('unlink', (file) => handleFileStructureChange(file, 'unlink'))
      },

      // Hot update handling for existing files
      async handleHotUpdate({ file, server, modules }) {
        debug(`handleHotUpdate`, file)
        if (!Content.isPageFile(file, config.paths.project.absolute.pages)) return

        debug(`Page file changed:`, file)

        // Get current pages before clearing cache
        const oldPages = await scanPages()

        // Clear cache and rescan
        scanPages.clear()
        const newScanResult = await scanPages()

        // Check if the visible pages list changed. This can happen when:
        // - A page's frontmatter `hidden` field changes (true <-> false)
        // - A page's frontmatter affects its route (though we don't support this yet)
        // If only the content changed (not frontmatter), we can use fast HMR.
        const pageStructureChanged = !oldPages || !Arr.equalShallowly(
          oldPages.list.map(p => Path.format(p.route.file.path.absolute)),
          newScanResult.list.map(p => Path.format(p.route.file.path.absolute)),
        )

        if (!pageStructureChanged) {
          debug(`Page content changed, allowing HMR`)
          // Let default HMR handle the MDX file change
          return modules
        }

        //
        // ━━ Manual Invalidation
        //

        debug(`Page structure changed, triggering full reload`)

        // Invalidate virtual modules and trigger reload
        invalidateVirtualModules(server)
        reportDiagnostics(newScanResult.diagnostics)
        server.ws.send({ type: `full-reload` })
        return []
      },
      resolveId(id) {
        if (id === viProjectPagesCatalog.id) {
          return viProjectPagesCatalog.resolved
        }
      },
      load: {
        // filter: {
        //   id: viProjectPagesData.resolved,
        // },
        async handler(id) {
          if (id !== viProjectPagesCatalog.resolved) return
          debug(`viProjectPagesCatalog`)

          const scanResult = await scanPages()

          // Report any diagnostics
          reportDiagnostics(scanResult.diagnostics)
          debug(`Found ${String(scanResult.list.length)} visible pages`)

          //
          // ━━ Build Navbar
          //

          // Update navbar if provided
          if (navbarData) {
            const navbarPages = navbarData.get('pages')
            navbarPages.length = 0 // Clear existing

            const navbarItems = createNavbar(scanResult.list)
            navbarPages.push(...navbarItems)
          }

          //
          // ━━ Build Sidebar
          //

          const sidebarIndex = Content.buildSidebarIndex(scanResult)

          //
          // ━━ Put It All together
          //

          const projectPagesCatalog: ProjectPagesCatalog = {
            sidebarIndex,
            pages: scanResult.list,
          }

          // Return just the JSON string - let the JSON plugin handle the transformation
          return superjson.stringify(projectPagesCatalog)
        },
      },
    },
    // Plugin 3: Virtual Module for React Router Routes
    {
      name: 'polen:routes',
      resolveId(id) {
        if (id === viProjectRoutes.id) {
          return viProjectRoutes.resolved
        }
      },
      load: {
        // filter: {
        //   id: viProjectPages.resolved,
        // },
        handler: async (id) => {
          if (id !== viProjectRoutes.resolved) return

          debug(`Loading viProjectRoutes virtual module`)

          const scanResult = await scanPages()
          reportDiagnostics(scanResult.diagnostics)
          const code = generateRoutesModule(scanResult.list)

          // Generate the module code
          return {
            code,
            moduleType: 'js',
          }
        },
      },
    },
  ]
}
