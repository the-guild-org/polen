import type { Config } from '#api/config/index'
import { Content } from '#api/content/$'
import type { NavbarDataRegistry } from '#api/vite/data/navbar'
import { polenVirtual } from '#api/vite/vi'
import type { Vite } from '#dep/vite/index'
import { reportDiagnostics } from '#lib/file-router/diagnostic-reporter'
import { FileRouter } from '#lib/file-router/index'
import { debugPolen } from '#singletons/debug'
import { superjson } from '#singletons/superjson'
import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import { Tree } from '@wollybeard/kit'
import { Arr, Cache, Path, Str } from '@wollybeard/kit'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

const debug = debugPolen.sub(`vite-plugin-pages`)

export const viProjectPages = polenVirtual([`project`, `pages.jsx`], { allowPluginProcessing: true })
export const viProjectPagesData = polenVirtual([`project`, `data`, 'pages.jsonsuper'], { allowPluginProcessing: true })

export interface Options {
  config: Config.Config
  navbarData?: NavbarDataRegistry
  onChange?: (scanResult: Content.ScanResult) => void
}

export interface ProjectDataPages {
  sidebarIndex: SidebarIndex
  pages: Content.Page[]
}

export interface SidebarIndex {
  [pathExpression: string]: Content.Sidebar
}

/**
 * Pages plugin with tree support
 */
export const Pages = ({
  config,
  navbarData,
  onChange,
}: Options): Vite.Plugin[] => {
  const scanPages = Cache.memoize(debug.trace(async function scanPages() {
    const result = await Content.scan({
      dir: config.paths.project.absolute.pages,
      glob: `**/*.{md,mdx}`,
    })
    return result
  }))

  const isPageFile = (file: string) => {
    return (file.endsWith(`.md`) || file.endsWith(`.mdx`))
      && file.includes(config.paths.project.absolute.pages)
  }

  const generatePagesModule = (pages: Content.Page[]): string => {
    const $ = {
      pages: `pages`,
    }

    const s = Str.Builder()
    s`export const ${$.pages} = []`

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

        ${$$.pages}.push({
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
              defaultColor: false,
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
      },

      // Hot update handling
      async handleHotUpdate({ file, server, modules }) {
        debug(`handleHotUpdate`, file)
        if (!isPageFile(file)) return

        debug(`Page file changed:`, file)

        // Get current pages before clearing cache
        const oldPages = await scanPages()

        // Clear cache and rescan
        scanPages.clear()
        const newScanResult = await scanPages()

        // Check if page structure changed (added/removed pages)
        const isJustContentChange = oldPages && !Arr.equalShallowly(
          oldPages.list.map(p => Path.format(p.route.file.path.absolute)),
          newScanResult.list.map(p => Path.format(p.route.file.path.absolute)),
        )

        if (isJustContentChange) {
          debug(`Page content changed, allowing HMR`)
          // Let default HMR handle the MDX file change
          return modules
        }

        //
        // ━━ Manual Invalidation
        //

        debug(`Page structure changed, triggering full reload`)

        // Invalidate virtual module
        const mod = server.moduleGraph.getModuleById(viProjectPages.id)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          debug(`Invalidated pages virtual module`)
        }

        // Notify about changes
        if (onChange) {
          reportDiagnostics(newScanResult.diagnostics)
          onChange(newScanResult)
        }

        // Trigger full reload for structure changes
        server.ws.send({ type: `full-reload` })
        return []
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
          debug(`viProjectDataPages`)

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

            // Process first-level children as navigation items
            if (scanResult.tree.root) {
              for (const child of scanResult.tree.root.children) {
                // Now we have Page objects in the tree
                const page = child.value
                const pathExp = FileRouter.routeToPathExpression(page.route)

                // Skip hidden pages and index files at root level
                if (page.metadata.hidden || page.route.logical.path.slice(-1)[0] === 'index') {
                  continue
                }

                // Only include top-level pages (files directly in pages directory)
                if (page.route.logical.path.length === 1) {
                  const title = Str.titlizeSlug(page.route.logical.path[0]!)
                  navbarPages.push({
                    // IMPORTANT: Always ensure paths start with '/' for React Router compatibility.
                    pathExp: pathExp.startsWith('/') ? pathExp : '/' + pathExp,
                    title,
                  })
                }
              }
            }
          }

          //
          // ━━ Build Sidebar
          //

          const sidebarIndex: SidebarIndex = {}

          // Build sidebar for each top-level directory using the page tree
          if (scanResult.tree.root) {
            Tree.visit(scanResult.tree, (node) => {
              if (!node.value) return
              const page = node.value as any
              // Only process top-level directories (pages with logical path length > 1 indicate nested structure)
              if (page.route.logical.path.length === 1 && node.children.length > 0) {
                const topLevelDir = page.route.logical.path[0]!
                const pathExp = `/${topLevelDir}`

                // Create a subtree for this directory
                const subtree = Tree.Tree(Tree.Node(page, node.children)) as Tree.Tree<any>

                // Build sidebar using the new page tree builder
                const sidebar = Content.buildFromPageTree(subtree, [topLevelDir])
                debug(`Built sidebar for ${pathExp}:`, sidebar)
                sidebarIndex[pathExp] = sidebar
              }
            })
          }

          //
          // ━━ Put It All together
          //

          const projectDataPages: ProjectDataPages = {
            sidebarIndex,
            pages: scanResult.list,
          }

          // Return just the JSON string - let the JSON plugin handle the transformation
          return superjson.stringify(projectDataPages)
        },
      },
    },
    // Plugin 3: Virtual Module for Pages Routes
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

          debug(`Loading viProjectPages virtual module`)

          const scanResult = await scanPages()
          reportDiagnostics(scanResult.diagnostics)
          const code = generatePagesModule(scanResult.list)

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
