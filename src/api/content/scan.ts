import { E, O, S } from '#dep/effect'
import { FileRouter } from '#lib/file-router'
import { FileSystem } from '@effect/platform'
import { Path, Tree } from '@wollybeard/kit'
import { Effect } from 'effect'
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
  dir: string
  glob?: string
  /** Include hidden pages in the result (useful for debugging or admin interfaces) */
  includeHidden?: boolean
}): Effect.Effect<ScanResult, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    // Scan for routes
    const routeScanResult = yield* FileRouter.scan({
      dir: options.dir,
      glob: options.glob ?? `**/*.{md,mdx}`,
    })

    // Create pages with metadata (id/parentId now come from route)
    const allPages = yield* Effect.all(
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
              absolute: Path.parse(``),
              relative: Path.parse(``),
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
const readRoute = (route: FileRouter.Route): Effect.Effect<Page, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const filePath = Path.format(route.file.path.absolute)
    const fileContent = yield* fs.readFileString(filePath).pipe(
      Effect.mapError(error => new Error(`Failed to read file ${filePath}: ${error}`)),
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

    if (E.isLeft(parsed)) {
      // Log warning but continue with defaults
      console.warn(`Invalid front matter in ${filePath}:`, parsed.left)
    }

    const metadata = E.isRight(parsed) ? parsed.right : { hidden: false }
    return { route, metadata }
  })
