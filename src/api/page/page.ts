import { Marked } from '#dep/marked/index.js'
import { Debug } from '#lib/debug/index.js'
import { FileRouter } from '#lib/file-router/index.js'
import { Fs, Path } from '@wollybeard/kit'

export * from './lint.js'
export * as ReactRouterAdaptor from './react-router-adaptor.js'

const debug = Debug.create(`page`)

// Internal route representations for building the page tree
interface PageContentRouteData {
  type: `PageContentRoute` // To distinguish from PageSegmentRoute in unions if needed elsewhere
  /** The public URL-friendly path. E.g., "foo" for "foo.md" or "foo/index.md" */
  path: string
  /** An internal unique path to distinguish between e.g. foo.md and foo/index.md. E.g., "foo" or "foo/index" */
  pathExplicit: string
  segments: string[]
  isIndex: boolean
}

interface PageSegmentRouteData {
  type: `PageSegmentRoute`
  /** The public URL-friendly path. E.g., "foo" */
  path: string
  /** An internal unique path, same as path for segments. E.g., "foo" */
  pathExplicit: string
  segments: string[]
}

export interface Page {
  content: {
    markdown: string
    html: string
  }
  route: PageContentRouteData
  file: {
    /** Absolute path to the source file. */
    path: string
  }
}

export interface PageBranchContent extends Page {
  type: `PageBranchContent`
  branches: PageBranch[]
}

export interface PageBranchSegment {
  type: `PageBranchSegment`
  route: PageSegmentRouteData
  branches: PageBranch[]
}

/**
 * Checks if a segment contains an index page in which case this segment can also be considered like a content page.
 */
export const isPageBranchSegmentAlsoContent = (segment: PageBranchSegment): boolean => {
  return segment.branches.some(branch => branch.type === `PageBranchContent` && branch.route.isIndex)
}

export type PageBranch = PageBranchContent | PageBranchSegment

export type PageTree = PageBranch[]

export const readAll = async (parameters: { dir: string }): Promise<PageTree> => {
  const { dir } = parameters
  debug(`reading all pages from directory`, { dir })

  const routes = await FileRouter.scan({
    baseDir: dir,
    extensions: [`md`, `mdx`], // TODO: Make extensions configurable or derive from future needs
  })
  debug(`found page files via FileRouter`, { count: routes.length })

  const pages = await Promise.all(
    routes.map(routeToPage),
  )
  debug(`created pages from file routes`, { count: pages.length })

  const pageBranches = pagesToPageBranches(pages)
  debug(`created page branches`, { treeSize: pageBranches.length })

  return pageBranches
}

export const routeToPage = async (route: FileRouter.Route): Promise<Page> => {
  const markdown = await Fs.readOrThrow(route.filePath)
  const html = await Marked.parse(markdown) // TODO: This will need to change for MDX files

  const pageRouteData: PageContentRouteData = {
    type: `PageContentRoute`,
    path: route.routePath,
    // pathExplicit is the unique path for map keys, e.g. foo/bar or foo/index
    pathExplicit: Path.join(route.dirRelative, route.fileNameNoExt).replace(
      /^\.$/,
      route.fileNameNoExt,
    ), // Handle root files
    segments: route.pathSegments,
    isIndex: route.isIndex,
  }

  const page: Page = {
    content: {
      markdown: markdown,
      html: html,
    },
    route: pageRouteData,
    file: {
      path: route.filePath,
    },
  }
  return page
}

export const pagesToPageBranches = (pages: Page[]): PageBranch[] => {
  const pageBranchByExplicitPath = new Map<string, PageBranch>()
  const topLevelPageTrees: PageBranch[] = []

  const registerBranch = (pageBranch: PageBranch) => {
    pageBranchByExplicitPath.set(pageBranch.route.pathExplicit, pageBranch)
  }

  // First, convert all Page objects to PageBranchContent and register them
  pages.forEach(page => {
    registerBranch({
      type: `PageBranchContent`,
      ...page, // route is PageContentRouteData
      branches: [],
    })
  })

  // For each page branch (content or segment), connect it to its parent.
  // Iterate multiple times or use a queue to handle dynamically created segments.
  // A simpler way is to iterate over a copy of keys, as the map can grow.
  const explicitPathsToProcess = [...pageBranchByExplicitPath.keys()]

  for (const explicitPath of explicitPathsToProcess) {
    const pageBranch = pageBranchByExplicitPath.get(explicitPath)! // Should always exist

    // Determine parent path
    // For route.path = "a/b", segments = ["a", "b"], parentPath = "a"
    // For route.path = "a" (from a/index.md or a.md), segments = ["a"], parentPath = ""
    // For route.path = "" (from index.md), segments = [], parentPath = "" (special case, handled by segments.length === 0)
    let parentExplicitPath: string
    let parentPath: string
    let parentSegments: string[]

    if (pageBranch.route.segments.length === 0) { // Root index case
      topLevelPageTrees.push(pageBranch)
      continue
    }

    parentSegments = pageBranch.route.segments.slice(0, -1)
    parentPath = parentSegments.join(Path.sep)

    // Parent's explicit path is same as its public path for segments
    parentExplicitPath = parentPath

    if (parentPath === ``) {
      topLevelPageTrees.push(pageBranch)
      continue
    }

    let parent = pageBranchByExplicitPath.get(parentExplicitPath)

    if (!parent) {
      debug(`inferring parent segment`, { parentPath, parentExplicitPath })
      const newParentSegment: PageBranchSegment = {
        type: `PageBranchSegment`,
        route: {
          type: `PageSegmentRoute`,
          path: parentPath,
          pathExplicit: parentExplicitPath,
          segments: parentSegments,
        },
        branches: [],
      }
      registerBranch(newParentSegment) // Add to map so it can be processed if it's not top-level
      parent = newParentSegment
      // Add the newly created segment to its parent or topLevelPageTrees
      // This requires ensuring new segments are also processed.
      // The current loop structure (iterating initial keys) means new segments
      // are added to map but not processed in *this* loop.
      // This is fixed by adding newly created segments to a processing queue or iterating until no changes.
      // For now, let's add to topLevelPageTrees if its parent is root.
      // A more robust solution may be needed if deep non-content paths are common.
      // This simpler logic assumes that if a segment is created, its parent path (if not root)
      // must correspond to an existing content page or another segment that will be found.
      // The original code structure implicitly handled this by re-iterating the growing map.
      // Let's add it to explicitPathsToProcess to ensure it's parented correctly.
      if (!explicitPathsToProcess.includes(parentExplicitPath)) {
        explicitPathsToProcess.push(parentExplicitPath) // Process this new segment later in the loop
      }
    }
    parent.branches.push(pageBranch)
  }

  // Filter out non-top-level branches that were added to map but are children of other map branches
  // The `topLevelPageTrees` should be the source of truth.
  // The previous loop adds any branch whose parent path is "" to topLevelPageTrees.
  // If a segment was created, and its parentPath is "", it gets added.
  // If its parentPath is not "", it gets added to its parent's branches.
  // The main issue with the previous loop is that a new segment's parent might not exist yet.
  //
  // Let's retry the createPageBranchesFromPages structure to be more robust
  // by building from leaves up or ensuring parents are created first.

  // Alternative: iterate all registered branches (content and segments) and connect them.
  // This requires ensuring segments are created for all necessary paths first, or iteratively.

  // Re-simplifying to a structure closer to original, which was implicitly iterative due to Map iteration.
  const finalTopLevelPageTrees: PageBranch[] = []
  const processedExplicitPaths = new Set<string>()

  // Use a queue for processing, starting with all content pages
  const queue = pages.map(p => p.route.pathExplicit)

  while (queue.length > 0) {
    const currentExplicitPath = queue.shift()!
    if (processedExplicitPaths.has(currentExplicitPath)) continue

    const pageBranch = pageBranchByExplicitPath.get(currentExplicitPath)

    if (!pageBranch) {
      // This could happen if a segment was queued but not yet created.
      // For now, assume initial population covers all content.
      // This part implies segments must be created and added to pageBranchByExplicitPath before being queued.
      // Let's ensure segments are created and registered if needed when finding a parent.
      debug(`WARNING: Branch not found in map during queue processing`, { currentExplicitPath })
      continue
    }

    processedExplicitPaths.add(currentExplicitPath)

    let parentExplicitPath: string
    let parentPathValue: string // Renamed to avoid conflict with kit.Path
    let parentSegmentsValue: string[]

    if (pageBranch.route.segments.length === 0) {
      if (!finalTopLevelPageTrees.includes(pageBranch)) finalTopLevelPageTrees.push(pageBranch)
      continue
    }

    parentSegmentsValue = pageBranch.route.segments.slice(0, -1)
    parentPathValue = parentSegmentsValue.join(Path.sep)
    parentExplicitPath = parentPathValue // For segments, explicit and public paths are the same

    if (parentPathValue === ``) {
      if (!finalTopLevelPageTrees.includes(pageBranch)) finalTopLevelPageTrees.push(pageBranch)
      continue
    }

    let parentBranch = pageBranchByExplicitPath.get(parentExplicitPath)

    if (!parentBranch) {
      debug(`inferring parent segment during queue processing`, { parentPathValue, parentExplicitPath })
      const newParentSegment: PageBranchSegment = {
        type: `PageBranchSegment`,
        route: {
          type: `PageSegmentRoute`,
          path: parentPathValue,
          pathExplicit: parentExplicitPath,
          segments: parentSegmentsValue,
        },
        branches: [],
      }
      registerBranch(newParentSegment) // Add to map
      parentBranch = newParentSegment
      if (!processedExplicitPaths.has(parentExplicitPath) && !queue.includes(parentExplicitPath)) {
        queue.push(parentExplicitPath) // Add new segment to queue for parenting
      }
    }
    // Ensure branch is not added multiple times if logic reruns
    if (!parentBranch.branches.includes(pageBranch)) {
      parentBranch.branches.push(pageBranch)
    }
  }

  if (finalTopLevelPageTrees.length === 0 && pageBranchByExplicitPath.size > 0) {
    // This can happen if only e.g. pages/foo/bar.md exists. foo/bar.md is not top level.
    // Its parent 'foo' (segment) should become top level.
    // The queue processing should handle this by adding 'foo' (segment) to the queue,
    // which then finds its parent ('') and adds 'foo' to finalTopLevelPageTrees.
    // If still no top-level pages, it might be an error or an empty pages dir.
    // Let's check if all items in pageBranchByExplicitPath are actually parented or are in topLevel.
    // For robust error, if size > 0 and finalTopLevel.length == 0 it indicates an issue.
    debug(`Warning: No top-level pages found, but pages exist. This might be an issue if pages were expected.`, {
      mapSize: pageBranchByExplicitPath.size,
    })
  }

  // Sort branches at each level for stable output (e.g. for snapshots)
  const sortBranches = (branches: PageBranch[]) => {
    branches.sort((a, b) => a.route.pathExplicit.localeCompare(b.route.pathExplicit))
    branches.forEach(branch => {
      sortBranches(branch.branches)
    })
  }
  sortBranches(finalTopLevelPageTrees)

  return finalTopLevelPageTrees
}
