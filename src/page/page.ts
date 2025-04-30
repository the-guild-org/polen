import { Fs } from '../lib-dep/fs/index.js'
import { Path } from '../lib-dep/path/index.js'
import { TinyGlobby } from '../lib-dep/tiny-globby/index.js'
import type { RouteIndex, RouteItem, RouteSegment } from './route.js'
import { calcParentRoutePath, filePathToPageRoute, isRouteTopLevel } from './route.js'
import { Marked } from '../lib-dep/marked/index.js'
import { Debug } from '../lib/debug/index.js'

export * from './lint.js'
export * as ReactRouterAdaptor from './react-router-adaptor.js'

const debug = Debug.create(`page`)

export interface Page {
  content: {
    markdown: string,
    html: string,
  }
  route: RouteIndex | RouteItem
  file: {
    path: string,
  }
}

export interface PageBranchContent extends Page {
  type: `PageBranchContent`
  branches: PageBranch[]
}

export interface PageBranchSegment {
  type: `PageBranchSegment`
  route: RouteSegment
  branches: PageBranch[]
}

export type PageBranch = PageBranchContent | PageBranchSegment

export type PageTree = PageBranch[]

export const readAll = async (parameters: { dir: string }): Promise<PageTree> => {
  const projectDir = parameters.dir
  const pagesDir = Path.join(projectDir, `pages`)
  const globPattern = `**/*.md`
  debug(`search page files`, { globPattern, pagesDir })

  const filePaths = await TinyGlobby.glob(globPattern, {
    absolute: true,
    cwd: pagesDir,
    onlyFiles: true,
    // debug: true,
  })
  debug(`found page files`, filePaths)

  const pages = await Promise.all(
    filePaths.map(filePath => createPageFromFilePath(filePath, pagesDir)),
  )
  debug(`created pages`, pages)

  const pageBranches = createPageBranchesFromPages(pages)
  debug(`created page branches`, pageBranches)

  return pageBranches
}

export const createPageFromFilePath = async (filePath: string, rootDir: string): Promise<Page> => {
  const markdown = await Fs.readFile(filePath, `utf-8`)
  const html = await Marked.parse(markdown)
  const route = filePathToPageRoute(filePath, rootDir)
  const page: Page = {
    content: {
      markdown: markdown,
      html: html,
    },
    route,
    file: {
      path: filePath,
    },
  }
  return page
}

export const createPageBranchesFromPages = (pages: Page[]): PageBranch[] => {
  // Create a map of page paths to their corresponding PageTree objects
  const pageBranchByRoutePath = new Map<string, PageBranch>()
  // Array to store top-level pages (those without parents)
  const topLevelPageTrees: PageBranch[] = []

  const registerBranch = (pageBranch: PageBranch) => {
    pageBranchByRoutePath.set(pageBranch.route.pathExplicit, pageBranch)
  }

  pages.forEach(page => {
    registerBranch({
      type: `PageBranchContent`,
      ...page,
      branches: [],
    })
  })

  // For each page branch, connect it to its parent
  pageBranchByRoutePath.forEach(pageBranch => {
    if (isRouteTopLevel(pageBranch.route)) {
      topLevelPageTrees.push(pageBranch)
      return
    }

    const parentRoutePath = calcParentRoutePath(pageBranch.route)
    let parent = pageBranchByRoutePath.get(parentRoutePath.raw)

    // If there is no explicit parent then infer a route segment for its parent.
    // This is analogous o "prefix routes" in React Router, see: https://reactrouter.com/start/data/routing#prefix-route
    if (!parent) {
      debug(`infer parent route`, parentRoutePath)
      parent = {
        type: `PageBranchSegment`,
        route: {
          type: `RouteSegment`,
          path: parentRoutePath,
          pathExplicit: parentRoutePath.raw,
        },
        branches: [],
      }
      registerBranch(parent)
    }

    parent.branches.push(pageBranch)
  })

  if (topLevelPageTrees.length === 0 && pageBranchByRoutePath.size > 0) {
    throw new Error(`No top-level pages found`)
  }

  return topLevelPageTrees
}
