import type { Config } from '#api/config/index'
import { Content } from '#api/content/$'
import { createNavbar } from '#api/content/navbar'
import type { PolenState } from '#api/vite/state/index'
import { polenVirtual } from '#api/vite/vi'
import type { Vite } from '#dep/vite/index'
import { reportDiagnostics } from '#lib/file-router/diagnostic-reporter'
import { FileRouter } from '#lib/file-router/index'
import { debugPolen } from '#singletons/debug'
import { superjson } from '#singletons/superjson'
// import mdx from '@mdx-js/rollup'
import { Arr, Cache, Path, Str } from '@wollybeard/kit'
import { neverCase } from '@wollybeard/kit/language'
// import remarkFrontmatter from 'remark-frontmatter'
// import remarkGfm from 'remark-gfm'

const debug = debugPolen.sub(`vite-pages`)
const debugRoutes = debug.sub(`routes`)

export const viProjectRoutes = polenVirtual([`project`, `routes.jsx`], { allowPluginProcessing: true })
export const viProjectPagesCatalog = polenVirtual([`project`, `data`, `pages-catalog.jsonsuper`], {
  allowPluginProcessing: true,
})

export interface Options {
  config: Config.Config
  state: PolenState
}

export interface ProjectPagesCatalog {
  sidebarIndex: Content.SidebarIndex
  pages: Content.Page[]
}

export const Pages = ({
  config,
  state,
}: Options): Vite.Plugin[] => {
  const scanPages = Cache.memoize(debug.trace(async function scanPages() {
    const result = await Content.scan({
      dir: config.paths.project.absolute.pages,
      glob: `**/*.{md,mdx}`,
    })
    return result
  }))

  const generateRoutesModule = (pages: Content.Page[]): string => {
    const s = Str.Builder()

    const $ = {
      routes: `routes`,
    }

    s`export const ${$.routes} = []`

    // Generate route configuration entries for React Router
    for (const page of pages) {
      const pathExp = FileRouter.routeToPathExpression(page.route)

      s`
        ${$.routes}.push({
          id: '${page.route.id}',
          path: '${pathExp}',
          file: 'routes/page.tsx',
        })
      `
    }

    return s.render()
  }

  return [
    //
    //
    //
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • MDX Processing
    //
    //

    // {
    //   enforce: `pre` as const,
    //   ...mdx({
    //     jsxImportSource: `polen/react`,
    //     remarkPlugins: [
    //       // Parse frontmatter blocks so they're removed from content
    //       remarkFrontmatter,
    //       remarkGfm,
    //     ],
    //     rehypePlugins: [],
    //   }),
    // },

    //
    //
    //
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Pages Management
    //
    //

    {
      name: `polen:pages`,

      async buildStart() {
        this.addWatchFile(config.paths.project.absolute.pages)
      },

      // configureServer(server) {
      //   debug(`configureServer: add watcher for pages directory`, config.paths.project.absolute.pages)
      //   server.watcher.add(config.paths.project.absolute.pages)
      // },

      async hotUpdate({ file, type, modules }) {
        if (!Content.isPageFile(file, config.paths.project.absolute.pages)) return

        debug(`hotUpdate`, { file, type })

        // Helper function to invalidate virtual modules and trigger reload
        const invalidateAndFullReload = (newScanResult: Content.ScanResult) => {
          const routesModule = this.environment.moduleGraph.getModuleById(viProjectRoutes.id)
          if (routesModule) {
            this.environment.moduleGraph.invalidateModule(routesModule)
            debug(`Invalidated routes`)
          }

          const catalogModule = this.environment.moduleGraph.getModuleById(viProjectPagesCatalog.id)
          if (catalogModule) {
            this.environment.moduleGraph.invalidateModule(catalogModule)
            debug(`Invalidated catalog`)
          }

          reportDiagnostics(newScanResult.diagnostics)
          this.environment.hot.send({ type: `full-reload` })
        }

        switch (type) {
          case 'create':
          case 'delete': {
            scanPages.clear()
            const newScanResult = await scanPages()
            invalidateAndFullReload(newScanResult)
            return []
          }
          case 'update': {
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

            debug(`Page structure changed during update, triggering full reload`)
            invalidateAndFullReload(newScanResult)
            return []
          }
          default: {
            neverCase(type)
          }
        }
      },
      resolveId(id) {
        if (id === viProjectPagesCatalog.id) {
          return viProjectPagesCatalog.resolved
        }
      },
      async load(id) {
        if (id !== viProjectPagesCatalog.resolved) return
        debug(`hook load`)

        const scanResult = await scanPages()

        reportDiagnostics(scanResult.diagnostics)
        debug(`found visible`, { count: scanResult.list.length })

        //
        // ━━ Build Navbar
        //

        if (state.navbar) {
          const navbarPages = state.navbar.get(`pages`)

          navbarPages.length = 0 // Clear existing

          const navbarData = createNavbar(scanResult.list)

          debug(`update navbar`, navbarData)

          navbarPages.push(...navbarData)
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

    //
    //
    //
    //
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Virtual Module for React Router Routes
    //
    //
    {
      name: `polen:pages:routes`,
      resolveId(id) {
        // console.log(`[Pages Plugin] resolveId in environment`, this.environment.name, id)
        if (id === viProjectRoutes.id) {
          return viProjectRoutes.resolved
        }
      },
      async load(id) {
        if (id !== viProjectRoutes.resolved) return

        debugRoutes(`load`, {
          id,
          environment: {
            name: this.environment.name,
          },
        })

        const scanResult = await scanPages()
        reportDiagnostics(scanResult.diagnostics)
        const code = generateRoutesModule(scanResult.list)

        return {
          code,
          moduleType: `js`,
        }
      },
    },
  ]
}
