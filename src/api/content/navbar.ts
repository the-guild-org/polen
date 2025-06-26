import { Str } from '@wollybeard/kit'
import type { Page } from './page.ts'

export interface NavbarItem {
  pathExp: string
  title: string
}

/**
 * Generate navbar items from a list of pages
 */
export const createNavbar = (pages: Page[]): NavbarItem[] => {
  const navbarItems: NavbarItem[] = []

  // Group pages by their top-level directory/segment
  const topLevelGroups = new Map<string, Page[]>()

  pages.forEach(page => {
    // Skip hidden pages
    if (page.metadata.hidden) return

    const firstSegment = page.route.logical.path[0]
    if (firstSegment) {
      if (!topLevelGroups.has(firstSegment)) {
        topLevelGroups.set(firstSegment, [])
      }
      topLevelGroups.get(firstSegment)!.push(page)
    }
  })

  // Add each top-level group to navbar
  topLevelGroups.forEach((pages, segment) => {
    // For directories, check if there's an index page
    const indexPage = pages.find(p =>
      p.route.logical.path.length === 1
      && p.route.file.path.relative.name === `index`
    )

    // For single non-index files at top level
    const singlePage = pages.length === 1 && pages[0]!.route.logical.path.length === 1
      && pages[0]!.route.file.path.relative.name !== `index`

    // Include in navbar if:
    // 1. It's a directory with an index page, OR
    // 2. It's a single top-level page (not index)
    if (indexPage || singlePage) {
      const title = Str.titlizeSlug(segment)
      const pathExp = `/${segment}`

      navbarItems.push({
        pathExp,
        title,
      })
    }
  })

  // Sort navbar items alphabetically for consistency
  navbarItems.sort((a, b) => a.title.localeCompare(b.title))

  return navbarItems
}
