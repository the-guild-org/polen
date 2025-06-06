import type { Config } from '#api/config/index.js'
import type { ReactRouter } from '#dep/react-router/index.js'
import type { Vite } from '#dep/vite/index.js'
import { FileRouter } from '#lib/file-router/index.js'
import { ViteVirtual } from '#lib/vite-virtual/index.js'
import mdx from '@mdx-js/rollup'
import { Cache, Idx, Json, Path, Str } from '@wollybeard/kit'
import jsesc from 'jsesc'
import remarkGfm from 'remark-gfm'
import type {
  ProjectData,
  Sidebar,
  SidebarIndex,
  SidebarNav,
  SidebarSection,
  SiteNavigationItem,
} from '../../../project-data.js'
import { superjson } from '../../../singletons/superjson.js'
import { SchemaAugmentation } from '../../schema-augmentation/index.js'
import { Schema } from '../../schema/index.js'
import { logger } from '../logger.js'
import { vi as pvi } from '../vi.js'

const viTemplateVariables = pvi([`template`, `variables`])
const viTemplateSchemaAugmentations = pvi([`template`, `schema-augmentations`])
const viProjectData = pvi([`project`, `data`])

const viProjectPages = pvi([`project`, `pages.jsx`], { allowPluginProcessing: true })
export interface ProjectPagesModule {
  pages: ReactRouter.RouteObject[]
}

export const Core = (config: Config.Config): Vite.PluginOption[] => {
  const scanPageRoutes = Cache.memoize(async () =>
    await FileRouter.scan({
      dir: config.paths.project.absolute.pages,
      glob: `**/*.{md,mdx}`,
    })
  )
  const readSchema = Cache.memoize(async () => {
    const schema = await Schema.readOrThrow({
      ...config.schema,
      projectRoot: config.paths.project.rootDir,
    })
    // todo: augmentations scoped to a version
    schema?.versions.forEach(version => {
      SchemaAugmentation.apply(version.after, config.schemaAugmentations)
    })
    return schema
  })

  return [
    // @see https://mdxjs.com/docs/getting-started/#vite
    {
      enforce: `pre`,
      // TODO: Use inline vite-plugin-mdx once transform hooks can change module type
      // @see https://github.com/rolldown/rolldown/issues/4004
      ...mdx({
        // jsxImportSource: `polen/react`,
        remarkPlugins: [
          remarkGfm,
        ],
      }),
    },
    // TODO: We can remove, mdx subsumes this
    // TODO: First we need to investigate how e can make our api singleton Markdown used by MDX.
    // If we cannot, then we might want to ditch MDX instead and use our lower level solution here.
    // It depends in part on how complex our Markdown singleton gets.
    // {
    //   name: `polen:markdown`,
    //   enforce: `pre`,
    //   resolveId(id) {
    //     if (id.endsWith(`.md`)) {
    //       return id
    //     }
    //     return null
    //   },
    //   async load(id) {
    //     if (id.endsWith(`.md`)) {
    //       const markdownString = await Fs.read(id)
    //       if (!markdownString) return null
    //       const htmlString = await Markdown.parse(markdownString)

    //       const code = `export default ${JSON.stringify(htmlString)}`
    //       return code
    //     }
    //     return null
    //   },
    // },
    {
      name: `polen:core:alias`,
      resolveId(id, importer) {
        if (!(importer && pvi.includes(importer))) return null

        const find = Str.pattern<{ groups: [`path`] }>(/^#(?<path>.+)/)
        const match = Str.match(id, find)
        if (!match) return null

        const replacement = `${config.paths.framework.sourceDir}/${match.groups.path}`
        return replacement
      },
    },
    {
      name: `polen:core`,
      config(_, { command }) {
        // isServing = command === `serve`
        return {
          root: config.paths.framework.rootDir,
          define: {
            __BUILDING__: Json.codec.serialize(command === `build`),
            __SERVING__: Json.codec.serialize(command === `serve`),
            __COMMAND__: Json.codec.serialize(command),
            __BUILD_ARCHITECTURE__: Json.codec.serialize(config.build.architecture),
            __BUILD_ARCHITECTURE_SSG__: Json.codec.serialize(config.build.architecture === `ssg`),
          },
          server: {
            port: 3000,
          },
          customLogger: logger,
          esbuild: false,
          // oxc: {
          //   jsx: {
          //     runtime: 'automatic',
          //     importSource: 'react',
          //   },
          // },
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
            // todo: parallel
            const schema = await readSchema()
            const pagesScanResult = await scanPageRoutes()

            const siteNavigationItems: SiteNavigationItem[] = []

            //
            // ━━ Build Navbar
            //

            // ━ Top pages become navigation items
            const topPages = pagesScanResult.routes.filter(FileRouter.routeIsTopLevel)

            for (const page of topPages) {
              const path = FileRouter.routeToPathExpression(page)
              const title = Str.titlizeSlug(path)
              siteNavigationItems.push({ pathExp: path, title })
            }

            // ━ Top directories become navigation items
            const topDirsPaths = pagesScanResult.routes
              .filter(FileRouter.routeIsSubLevel)
              // todo: kit, slice that understands non-empty
              // Arr.slice(route.path.segments, 1)
              .map(route => [route.logical.path[0]])

            for (const dir of topDirsPaths) {
              const pathExp = FileRouter.pathToExpression(dir)
              const title = Str.titlizeSlug(pathExp)
              // todo: this should never happen, if it does, swarn user
              // Only add if not already added as a top page
              if (!siteNavigationItems.some(item => item.pathExp === pathExp)) {
                siteNavigationItems.push({ pathExp: pathExp, title })
              }
            }

            // ━ Schema presence causes adding some navbar items
            if (schema) {
              siteNavigationItems.push({ pathExp: `/reference`, title: `Reference` })
              if (schema.versions.length > 1) {
                siteNavigationItems.push({ pathExp: `/changelog`, title: `Changelog` })
              }
            }

            //
            // ━━ Build Sidebar
            //

            const sidebarIndex: SidebarIndex = {}

            for (const dirPath of topDirsPaths) {
              const childPages = pagesScanResult.routes.filter(page => FileRouter.routeIsSubOf(page, dirPath))
              sidebarIndex[FileRouter.pathToExpression(dirPath)] = buildSidebar(childPages, dirPath)
            }

            //
            // ━━ Put It All together
            //

            const projectData: ProjectData = {
              schema,
              siteNavigationItems,
              sidebarIndex,
              faviconPath: `/logo.svg`,
              pagesScanResult: pagesScanResult,
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

            const projectDataCode = jsesc(superjson.stringify(projectData))
            const content = `
            import { superjson } from '#singletons/superjson.js'

            export const PROJECT_DATA = superjson.parse('${projectDataCode}')
          `

            return content
          },
        },
        {
          identifier: viProjectPages,
          async loader() {
            const pagesScanResult = await scanPageRoutes()

            const $ = {
              pages: `pages`,
            }

            const s = Str.Builder()
            s`export const ${$.pages} = []`

            // todo: kit fs should accept parsed file paths
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
          },
        },
      ),
    },
  ]
}

/**
 * Helper function to build sidebar items recursively
 */
const buildSidebar = (pages: FileRouter.Route[], basePath: FileRouter.Path): Sidebar => {
  const navs: SidebarNav[] = []
  const sections = Idx.create<SidebarSection, string>({ key: (item) => item.pathExp })

  // Items
  for (const page of pages) {
    const pageRelative = FileRouter.makeRelativeUnsafe(page, basePath)

    if (FileRouter.routeIsRootLevel(pageRelative)) {
      continue
    }

    if (FileRouter.routeIsTopLevel(pageRelative)) {
      // Section (index)
      if (FileRouter.routeIsFromIndexFile(pageRelative)) {
        const sectionPath = page.logical.path
        const sectionPathExp = FileRouter.pathToExpression(sectionPath)

        let section: SidebarSection | undefined
        section = sections.getAt(sectionPathExp)

        if (!section) {
          const sectionTitle = Str.titlizeSlug(FileRouter.pathToExpression(pageRelative.logical.path))
          section = {
            type: `SidebarSection`,
            title: sectionTitle,
            pathExp: sectionPathExp,
            isNavToo: false,
            navs: [],
          }

          sections.set(section)
        }
        section.isNavToo = true
        continue
      }

      // Nav
      navs.push(pageToSidebarNav(page, basePath))
      continue
    }

    // Section (sub-page)
    if (FileRouter.routeIsSubLevel(pageRelative)) {
      const sectionRelativePath = [pageRelative.logical.path[0]]
      const sectionPath = [...basePath, ...sectionRelativePath]
      const sectionPathExp = FileRouter.pathToExpression(sectionPath)

      let section: SidebarSection | undefined
      section = sections.getAt(sectionPathExp)

      if (!section) {
        const sectionTitle = Str.titlizeSlug(FileRouter.pathToExpression(sectionRelativePath))
        section = {
          type: `SidebarSection`,
          title: sectionTitle,
          pathExp: sectionPathExp,
          isNavToo: false,
          navs: [],
        }
        sections.set(section)
      }
      section.navs.push(pageToSidebarNav(page, sectionPath))
    }
  }

  const items = [...navs, ...sections.toArray()]

  return {
    items,
  }
}

const pageToSidebarNav = (page: FileRouter.Route, basePath: FileRouter.Path): SidebarNav => {
  const pagePathExp = FileRouter.routeToPathExpression(page)
  const pageRelative = FileRouter.makeRelativeUnsafe(page, basePath)
  const pageRelativePathExp = FileRouter.routeToPathExpression(pageRelative)

  return {
    type: `SidebarItem`,
    pathExp: pagePathExp,
    title: Str.titlizeSlug(pageRelativePathExp),
  }
}
