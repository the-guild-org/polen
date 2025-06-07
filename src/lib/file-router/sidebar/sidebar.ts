import { Idx, Str } from '@wollybeard/kit'
import * as FileRouter from '../file-router.ts'
import type { ItemLink, ItemSection, Sidebar } from './types.ts'

export * from './types.ts'

/**
 * Helper function to build sidebar items recursively
 */
export const build = (pages: FileRouter.Route[], basePath: FileRouter.Path): Sidebar => {
  const navs: ItemLink[] = []
  const sections = Idx.create<ItemSection, string>({ key: (item) => item.pathExp })

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

        let section: ItemSection | undefined
        section = sections.getAt(sectionPathExp)

        if (!section) {
          const sectionTitle = Str.titlizeSlug(FileRouter.pathToExpression(pageRelative.logical.path))
          section = {
            type: `ItemSection`,
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

      // Link
      navs.push(pageToItemLink(page, basePath))
      continue
    }

    // Section (sub-page)
    if (FileRouter.routeIsSubLevel(pageRelative)) {
      const sectionRelativePath = [pageRelative.logical.path[0]]
      const sectionPath = [...basePath, ...sectionRelativePath]
      const sectionPathExp = FileRouter.pathToExpression(sectionPath)

      let section: ItemSection | undefined
      section = sections.getAt(sectionPathExp)

      if (!section) {
        const sectionTitle = Str.titlizeSlug(FileRouter.pathToExpression(sectionRelativePath))
        section = {
          type: `ItemSection`,
          title: sectionTitle,
          pathExp: sectionPathExp,
          isNavToo: false,
          navs: [],
        }
        sections.set(section)
      }
      section.navs.push(pageToItemLink(page, sectionPath))
    }
  }

  const items = [...navs, ...sections.toArray()]

  return {
    items,
  }
}

const pageToItemLink = (page: FileRouter.Route, basePath: FileRouter.Path): ItemLink => {
  const pagePathExp = FileRouter.routeToPathExpression(page)
  const pageRelative = FileRouter.makeRelativeUnsafe(page, basePath)
  const pageRelativePathExp = FileRouter.routeToPathExpression(pageRelative)

  return {
    type: `ItemLink`,
    pathExp: pagePathExp,
    title: Str.titlizeSlug(pageRelativePathExp),
  }
}
