import { FileRouter } from '#lib/file-router/index.js'

export const scan = FileRouter.scan
//   async (input: ): Promise<void> => {
// }

// import { Marked } from '#dep/marked/index.js'
// import { TinyGlobby } from '#dep/tiny-globby/index.js'
// import { Debug } from '#lib/debug/index.js'
// import { Fs } from '@wollybeard/kit'
// import type { RouteIndex, RouteItem, RouteSegment } from '../../lib/file-router/route.js'
// import { calcParentRoutePath, filePathToRoute, isRouteTopLevel } from '../../lib/file-router/route.js'

// export * from './lint.js'
// export * as ReactRouterAdaptor from './react-router-adaptor.js'

// const debug = Debug.create(`page`)

// export interface Page {
//   content: {
//     markdown: string
//     html: string
//   }
//   route: RouteIndex | RouteItem
//   file: {
//     path: string
//   }
// }

// export interface PageBranchContent extends Page {
//   type: `PageBranchContent`
//   branches: PageBranch[]
// }

// export interface PageBranchSegment {
//   type: `PageBranchSegment`
//   route: RouteSegment
//   branches: PageBranch[]
// }

// export type PageBranch = PageBranchContent | PageBranchSegment

// export type PageTree = PageBranch[]

// export const readAll = async (parameters: { dir: string }): Promise<PageTree> => {
//   const { dir } = parameters
//   const globPattern = `**/*.md`
//   debug(`search page files`, { globPattern, dir })

//   const filePaths = await TinyGlobby.glob(globPattern, {
//     absolute: true,
//     cwd: dir,
//     onlyFiles: true,
//     // debug: true,
//   })
//   debug(`found page files`, filePaths)

//   const pages = await Promise.all(
//     filePaths.map(filePath => filePathToPage(filePath, dir)),
//   )
//   debug(`created pages`, pages)

//   const pageBranches = createPageBranchesFromPages(pages)
//   debug(`created page branches`, pageBranches)

//   return pageBranches
// }

// export const filePathToPage = async (filePath: string, rootDir: string): Promise<Page> => {
//   const markdown = await Fs.readOrThrow(filePath)
//   const html = await Marked.parse(markdown)
//   const route = filePathToRoute(filePath, rootDir)
//   const page: Page = {
//     content: {
//       markdown: markdown,

//       html: html,
//     },
//     route,
//     file: {
//       path: filePath,
//     },
//   }
//   return page
// }

// export const createPageBranchesFromPages = (pages: Page[]): PageBranch[] => {
//   // Create a map of page paths to their corresponding PageTree objects
//   const pageBranchByRoutePath = new Map<string, PageBranch>()
//   // Array to store top-level pages (those without parents)
//   const topLevelPageTrees: PageBranch[] = []

//   const registerBranch = (pageBranch: PageBranch) => {
//     pageBranchByRoutePath.set(pageBranch.route.pathExplicit, pageBranch)
//   }

//   pages.forEach(page => {
//     registerBranch({
//       type: `PageBranchContent`,
//       ...page,
//       branches: [],
//     })
//   })

//   // For each page branch, connect it to its parent
//   pageBranchByRoutePath.forEach(pageBranch => {
//     if (isRouteTopLevel(pageBranch.route)) {
//       topLevelPageTrees.push(pageBranch)
//       return
//     }

//     const parentRoutePath = calcParentRoutePath(pageBranch.route)
//     let parent = pageBranchByRoutePath.get(parentRoutePath.raw)

//     // If there is no explicit parent then infer a route segment for its parent.
//     // This is analogous o "prefix routes" in React Router, see: https://reactrouter.com/start/data/routing#prefix-route
//     if (!parent) {
//       debug(`infer parent route`, parentRoutePath)
//       parent = {
//         type: `PageBranchSegment`,
//         route: {
//           type: `RouteSegment`,
//           path: parentRoutePath,
//           pathExplicit: parentRoutePath.raw,
//         },
//         branches: [],
//       }
//       registerBranch(parent)
//     }

//     parent.branches.push(pageBranch)
//   })

//   if (topLevelPageTrees.length === 0 && pageBranchByRoutePath.size > 0) {
//     throw new Error(`No top-level pages found`)
//   }

//   return topLevelPageTrees
// }
