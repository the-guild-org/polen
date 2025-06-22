import { FileRouter } from '#lib/file-router/index'
import { Str } from '@wollybeard/kit'
import type { Page } from './page.ts'
import type { ScanResult } from './scan.ts'

/**
 * Represents a complete sidebar structure with navigation items.
 * This is the main data structure used to render sidebars in the UI.
 */
export interface Sidebar {
  /** Array of navigation items that can be either direct links or sections containing multiple links */
  items: Item[]
}

/**
 * A sidebar navigation item that can be either a direct link or a section containing multiple links.
 * @see {@link ItemLink} for direct navigation links
 * @see {@link ItemSection} for grouped navigation sections
 */
export type Item = ItemLink | ItemSection

/**
 * A direct navigation link in the sidebar.
 * Used for pages that don't have child pages.
 *
 * @example
 * ```ts
 * const link: ItemLink = {
 *   type: 'ItemLink',
 *   title: 'Getting Started',
 *   pathExp: 'guide/getting-started'
 * }
 * ```
 */
export interface ItemLink {
  /** Discriminator for TypeScript union types */
  type: `ItemLink`
  /** Display title for the link (e.g., "Getting Started") */
  title: string
  /** Path expression relative to the base path, without leading slash (e.g., "guide/getting-started") */
  pathExp: string
}

/**
 * A collapsible section in the sidebar that groups related links.
 * Used for directories that contain multiple pages.
 *
 * @example
 * ```ts
 * const section: ItemSection = {
 *   type: 'ItemSection',
 *   title: 'Guide',
 *   pathExp: 'guide',
 *   isLinkToo: true, // Has an index page
 *   links: [
 *     { type: 'ItemLink', title: 'Installation', pathExp: 'guide/installation' },
 *     { type: 'ItemLink', title: 'Configuration', pathExp: 'guide/configuration' }
 *   ]
 * }
 * ```
 */
export interface ItemSection {
  /** Discriminator for TypeScript union types */
  type: `ItemSection`
  /** Display title for the section (e.g., "Guide", "API Reference") */
  title: string
  /** Path expression for the section's index page, if it exists (e.g., "guide") */
  pathExp: string
  /** Whether this section also acts as a link (true if the directory has an index page) */
  isLinkToo: boolean
  /** Child navigation links within this section */
  links: ItemLink[]
}

/**
 * A mapping of route paths to their corresponding sidebar structures.
 * Used to store different sidebars for different sections of a site.
 *
 * @example
 * ```ts
 * const sidebarIndex: SidebarIndex = {
 *   '/guide': { items: [...] },     // Sidebar for /guide section
 *   '/api': { items: [...] },       // Sidebar for /api section
 *   '/reference': { items: [...] }  // Sidebar for /reference section
 * }
 * ```
 */
export type SidebarIndex = Record<string, Sidebar>

/**
 * Builds sidebars for all top-level directories that contain both an index page and nested content.
 *
 * This function analyzes a scan result to identify which directories should have sidebars.
 * A directory gets a sidebar if it meets these criteria:
 * 1. It's a top-level directory (e.g., /guide, /api, /docs)
 * 2. It has an index page (e.g., /guide/index.md)
 * 3. It has nested pages (e.g., /guide/getting-started.md, /guide/configuration.md)
 *
 * @param scanResult - The result of scanning pages, containing both a flat list and tree structure
 * @returns A mapping of route paths to sidebar structures
 *
 * @example
 * ```ts
 * const scanResult = await Content.scan({ dir: './pages' })
 * const sidebars = buildSidebarIndex(scanResult)
 * // Returns: {
 * //   '/guide': { items: [...] },
 * //   '/api': { items: [...] }
 * // }
 * ```
 */
export const buildSidebarIndex = (scanResult: ScanResult): SidebarIndex => {
  const sidebarIndex: SidebarIndex = {}

  // Group pages by their top-level directory
  const pagesByTopLevelDir = new Map<string, Page[]>()

  for (const page of scanResult.list) {
    const topLevelDir = page.route.logical.path[0]

    // Skip pages that are not in a directory or are hidden
    if (!topLevelDir || page.metadata.hidden) continue

    if (!pagesByTopLevelDir.has(topLevelDir)) {
      pagesByTopLevelDir.set(topLevelDir, [])
    }
    pagesByTopLevelDir.get(topLevelDir)!.push(page)
  }

  // Build sidebar for each directory that has an index page
  for (const [topLevelDir, pages] of pagesByTopLevelDir) {
    const hasIndexPage = pages.some(page =>
      page.route.logical.path.length === 1
      && FileRouter.routeIsFromIndexFile(page.route)
    )

    // Skip directories without index pages
    if (!hasIndexPage) continue

    const pathExp = `/${topLevelDir}`
    const sidebar = buildSidebarForDirectory(topLevelDir, pages)

    if (sidebar.items.length > 0) {
      sidebarIndex[pathExp] = sidebar
    }
  }

  return sidebarIndex
}

/**
 * Builds a sidebar for a specific directory from its pages
 */
const buildSidebarForDirectory = (topLevelDir: string, pages: Page[]): Sidebar => {
  const items: Item[] = []

  // Group pages by their immediate parent path
  const pagesByParent = new Map<string, Page[]>()

  for (const page of pages) {
    // Skip the index page at the top level directory
    if (page.route.logical.path.length === 1 && FileRouter.routeIsFromIndexFile(page.route)) {
      continue
    }

    // Get the immediate parent path (e.g., for ['guide', 'advanced', 'tips'], parent is ['guide', 'advanced'])
    const parentPath = page.route.logical.path.slice(0, -1).join('/')

    if (!pagesByParent.has(parentPath)) {
      pagesByParent.set(parentPath, [])
    }
    pagesByParent.get(parentPath)!.push(page)
  }

  // Process top-level pages (direct children of the directory)
  const topLevelPages = pagesByParent.get(topLevelDir) || []

  // Sort pages by their directory order (extracted from file path)
  const sortedTopLevelPages = [...topLevelPages].sort((a, b) => {
    // For sections, we need to look at the directory name in the file path
    const dirA = a.route.file.path.relative.dir.split('/').pop() || ''
    const dirB = b.route.file.path.relative.dir.split('/').pop() || ''

    // Extract order from directory names like "10_b", "20_c"
    const orderMatchA = dirA.match(/^(\d+)[_-]/)
    const orderMatchB = dirB.match(/^(\d+)[_-]/)

    const orderA = orderMatchA ? parseInt(orderMatchA[1]!, 10) : Number.MAX_SAFE_INTEGER
    const orderB = orderMatchB ? parseInt(orderMatchB[1]!, 10) : Number.MAX_SAFE_INTEGER

    if (orderA !== orderB) return orderA - orderB

    // Fall back to alphabetical order
    return dirA.localeCompare(dirB)
  })

  for (const page of sortedTopLevelPages) {
    const pageName = page.route.logical.path[page.route.logical.path.length - 1]!
    const childPath = page.route.logical.path.join('/')
    const childPages = pagesByParent.get(childPath) || []

    if (childPages.length > 0 || FileRouter.routeIsFromIndexFile(page.route)) {
      // This is a section (has children or is an index page for a subdirectory)
      const hasIndex = FileRouter.routeIsFromIndexFile(page.route)

      const section: ItemSection = {
        type: 'ItemSection',
        title: Str.titlizeSlug(pageName),
        pathExp: childPath,
        isLinkToo: hasIndex,
        links: [],
      }

      // Add direct children as links (sorted by order)
      const sortedChildPages = [...childPages].sort((a, b) => {
        const orderA = a.route.logical.order ?? Number.MAX_SAFE_INTEGER
        const orderB = b.route.logical.order ?? Number.MAX_SAFE_INTEGER
        return orderA - orderB
      })

      for (const childPage of sortedChildPages) {
        if (!FileRouter.routeIsFromIndexFile(childPage.route)) {
          section.links.push({
            type: 'ItemLink',
            title: Str.titlizeSlug(childPage.route.logical.path[childPage.route.logical.path.length - 1]!),
            pathExp: childPage.route.logical.path.join('/'),
          })
        }
      }

      // Also add any deeper descendants as flat links
      const allDescendants: Page[] = []
      for (const [parentPath, pagesInParent] of pagesByParent) {
        // Check if this path is a descendant (but not direct child)
        if (parentPath.startsWith(childPath + '/')) {
          for (const descendantPage of pagesInParent) {
            if (!FileRouter.routeIsFromIndexFile(descendantPage.route)) {
              allDescendants.push(descendantPage)
            }
          }
        }
      }

      // Sort all descendants by their full path order
      allDescendants.sort((a, b) => {
        // Compare paths segment by segment, considering order at each level
        const pathA = a.route.logical.path
        const pathB = b.route.logical.path
        const minLength = Math.min(pathA.length, pathB.length)

        for (let i = 0; i < minLength; i++) {
          const segmentCompare = pathA[i]!.localeCompare(pathB[i]!)
          if (segmentCompare !== 0) return segmentCompare
        }

        return pathA.length - pathB.length
      })

      for (const descendantPage of allDescendants) {
        section.links.push({
          type: 'ItemLink',
          title: Str.titlizeSlug(
            descendantPage.route.logical.path[descendantPage.route.logical.path.length - 1]!,
          ),
          pathExp: descendantPage.route.logical.path.join('/'),
        })
      }

      if (section.links.length > 0 || section.isLinkToo) {
        items.push(section)
      }
    } else {
      // This is a simple link
      items.push({
        type: 'ItemLink',
        title: Str.titlizeSlug(pageName),
        pathExp: page.route.logical.path.join('/'),
      })
    }
  }

  return { items }
}
