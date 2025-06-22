import { FileRouter } from '#lib/file-router/index'
import { Fs, Path, Tree } from '@wollybeard/kit'
import matter from 'gray-matter'
import { MetadataSchema } from './metadata.ts'
import type { Page } from './page.ts'

export interface ScanResult {
  list: Page[]
  tree: Tree.Tree<Page>
  diagnostics: FileRouter.Diagnostic[]
}

/**
 * Scan a directory for pages and extract metadata from their front matter
 * By default, hidden pages are filtered out from both the pages list and route tree.
 */
export const scan = async (options: {
  dir: string
  glob?: string
  /** Include hidden pages in the result (useful for debugging or admin interfaces) */
  includeHidden?: boolean
}): Promise<ScanResult> => {
  // Scan for routes
  const routeScanResult = await FileRouter.scan({
    dir: options.dir,
    glob: options.glob ?? '**/*.{md,mdx}',
  })

  // Create pages with metadata (id/parentId now come from route)
  const allPages = await Promise.all(
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

  const tree = Tree.fromList(pagesWithIds)

  return {
    list: pages,
    tree,
    diagnostics: routeScanResult.diagnostics,
  }
}

/**
 * Read a single route file and extract metadata from its front matter
 */
const readRoute = async (route: FileRouter.Route): Promise<Page> => {
  const filePath = Path.format(route.file.path.absolute)
  const fileContent = await Fs.read(filePath)

  // Empty files still get default metadata (not hidden by default)
  // This allows placeholder pages to exist in the navigation
  if (!fileContent) {
    return { route, metadata: { hidden: false } }
  }

  // Parse front matter
  const { data } = matter(fileContent)

  // Validate and parse the data
  const parsed = MetadataSchema.safeParse(data)

  if (!parsed.success) {
    // Log warning but continue with defaults
    console.warn(`Invalid front matter in ${filePath}:`, parsed.error.issues)
  }

  const metadata = parsed.success ? parsed.data : { hidden: false }
  return { route, metadata }
}
