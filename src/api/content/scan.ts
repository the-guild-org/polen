import { Ei, S } from '#dep/effect'
import { Ef } from '#dep/effect'
import { FileRouter } from '#lib/file-router'
import { FileSystem } from '@effect/platform'
import { Fs, FsLoc, Tree } from '@wollybeard/kit'
import matter from 'gray-matter'
import { MetadataSchema } from './metadata.js'
import type { Page } from './page.js'

export interface ScanResult {
  list: Page[]
  tree: Tree.Tree<Page>
  diagnostics: FileRouter.Diagnostic[]
}

/**
 * Scan a directory for pages and extract metadata from their front matter
 * By default, hidden pages are filtered out from both the pages list and route tree.
 */
export const scan = (options: {
  dir: FsLoc.AbsDir.AbsDir
  glob?: string
  files?: FsLoc.RelFile.RelFile[]
  /** Include hidden pages in the result (useful for debugging or admin interfaces) */
  includeHidden?: boolean
}): Ef.Effect<ScanResult, Error, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    // Scan for routes
    const routeScanResult = yield* FileRouter.scan({
      dir: options.dir,
      glob: options.glob ?? `**/*.{md,mdx}`,
      files: options.files,
    })

    // Create pages with metadata (id/parentId now come from route)
    const allPages = yield* Ef.all(
      routeScanResult.routes.map(route => readRoute(route)),
    )

    // Apply filtering if needed
    const pages = options.includeHidden
      ? allPages
      : allPages.filter(page => !page.metadata.hidden)

    // Build tree from pages using Tree.fromList
    // Transform pages to include id/parentId at the top level for Tree.fromList
    const pagesWithIds = pages.map(page => ({
      ...page,
      id: page.route.id,
      parentId: page.route.parentId,
    }))

    // Handle cases where there might be multiple root nodes
    // If all pages are at root level (no parentId), create a virtual root
    const hasMultipleRoots = pagesWithIds.filter(p => !p.parentId).length > 1

    let tree: Tree.Tree<Page>
    if (hasMultipleRoots) {
      // Create a virtual root node to hold all root-level pages
      const virtualRoot: Page & { id: string; parentId: string | null } = {
        route: {
          id: `__virtual_root__`,
          parentId: null,
          file: {
            path: {
              absolute: FsLoc.AbsFile.decodeSync('/__virtual_root__.md'),
              relative: FsLoc.RelFile.decodeSync('__virtual_root__.md'),
            },
          },
          logical: {
            path: [],
          },
        },
        metadata: { hidden: true },
        id: `__virtual_root__`,
        parentId: null,
      }

      // Update pages to have virtual root as parent if they don't have one
      const pagesWithVirtualRoot = pagesWithIds.map(page => ({
        ...page,
        parentId: page.parentId ?? `__virtual_root__`,
      }))

      tree = Tree.fromList([virtualRoot, ...pagesWithVirtualRoot])
    } else {
      tree = Tree.fromList(pagesWithIds)
    }

    return {
      list: pages,
      tree,
      diagnostics: routeScanResult.diagnostics,
    }
  })

/**
 * Read a single route file and extract metadata from its front matter
 */
const readRoute = (route: FileRouter.Route): Ef.Effect<Page, Error, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const filePath = FsLoc.encodeSync(route.file.path.absolute)
    const filePathLoc = route.file.path.absolute
    const fileContent = yield* Fs.readString(filePathLoc).pipe(
      Ef.mapError(error => new Error(`Failed to read file ${filePath}: ${error}`)),
    )

    // Empty files still get default metadata (not hidden by default)
    // This allows placeholder pages to exist in the navigation
    if (!fileContent) {
      return { route, metadata: { hidden: false } }
    }

    // Parse front matter
    const { data } = matter(fileContent)

    // Validate and parse the data
    const parsed = S.decodeUnknownEither(MetadataSchema)(data)

    if (Ei.isLeft(parsed)) {
      // Log warning but continue with defaults
      console.warn(`Invalid front matter in ${filePath}:`, parsed.left)
    }

    const metadata = Ei.isRight(parsed) ? parsed.right : { hidden: false }
    return { route, metadata }
  })
