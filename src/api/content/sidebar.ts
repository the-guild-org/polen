import { FileRouter } from '#lib/file-router/index'
import { Tree } from '@wollybeard/kit'
import { Str } from '@wollybeard/kit'
import type { Page } from './page.ts'

export interface Sidebar {
  items: Item[]
}

export type Item = ItemLink | ItemSection

export interface ItemLink {
  type: `ItemLink`
  title: string
  pathExp: string
}

export interface ItemSection {
  type: `ItemSection`
  title: string
  pathExp: string
  isLinkToo: boolean
  links: ItemLink[]
}

/**
 * Build sidebar from page tree structure
 */
export const buildFromPageTree = (pageTree: Tree.Tree<Page>, basePath: FileRouter.Path): Sidebar => {
  const links: ItemLink[] = []
  const sections: ItemSection[] = []

  // Process only the children of the root node
  if (pageTree.root) {
    for (const child of pageTree.root.children) {
      processPageNode(child, basePath, [], links, sections)
    }
  }

  const items = [...links, ...sections]

  return {
    items,
  }
}

const processPageNode = (
  node: Tree.Node<Page>,
  basePath: FileRouter.Path,
  parentPath: string[],
  links: ItemLink[],
  sections: ItemSection[],
): void => {
  const page = node.value
  const routeName = page.route.logical.path.slice(-1)[0] || 'index'
  const currentPath = [...parentPath, routeName]

  // If this page has children, treat it as a section
  if (node.children.length > 0) {
    const sectionPath = [...basePath, ...currentPath]
    const sectionPathExp = FileRouter.pathToExpression(sectionPath)
    const sectionTitle = Str.titlizeSlug(routeName)

    // Check if any child is an index page
    const hasIndexChild = node.children.some(child => isIndexPage(child.value))

    const section: ItemSection = {
      type: `ItemSection`,
      title: sectionTitle,
      pathExp: sectionPathExp.startsWith('/') ? sectionPathExp.slice(1) : sectionPathExp,
      isLinkToo: hasIndexChild, // Section is linkable if it has an index page
      links: [],
    }

    // Process all children as links for this section
    for (const child of node.children) {
      const childPage = child.value

      if (child.children.length > 0) {
        // This child has children - only collect its descendants, not the child itself
        collectPagesFromNode(child, basePath, section.links)
      } else if (!childPage.metadata.hidden && !isIndexPage(childPage)) {
        // This is a leaf node - add it as a link
        section.links.push(pageToItemLink(childPage, basePath))
      }
    }

    sections.push(section)
  } else {
    // This is a standalone file - add as top-level link
    if (!page.metadata.hidden && !isIndexPage(page)) {
      links.push(pageToItemLink(page, basePath))
    }
  }
}

const collectPagesFromNode = (
  node: Tree.Node<Page>,
  basePath: FileRouter.Path,
  links: ItemLink[],
): void => {
  // Only process children, not the node itself (to avoid double-adding intermediate directories)
  for (const child of node.children) {
    const childPage = child.value
    if (childPage && !childPage.metadata.hidden && !isIndexPage(childPage)) {
      links.push(pageToItemLink(childPage, basePath))
    }

    // Recursively process grandchildren
    if (child.children.length > 0) {
      collectPagesFromNode(child, basePath, links)
    }
  }
}

const pageToItemLink = (page: Page, basePath: FileRouter.Path): ItemLink => {
  const pagePathExp = FileRouter.routeToPathExpression(page.route)
  const pageRelative = FileRouter.makeRelativeUnsafe(page.route, basePath)
  const pageRelativePathExp = FileRouter.routeToPathExpression(pageRelative)

  // Remove leading slash for title generation
  const titlePath = pageRelativePathExp.startsWith('/') ? pageRelativePathExp.slice(1) : pageRelativePathExp

  // Use only the last segment for the title
  const titleSegment = pageRelative.logical.path[pageRelative.logical.path.length - 1] || titlePath

  return {
    type: `ItemLink`,
    pathExp: pagePathExp.startsWith('/') ? pagePathExp.slice(1) : pagePathExp,
    title: Str.titlizeSlug(titleSegment),
  }
}

const isIndexPage = (page: Page): boolean => {
  return page.route.file.path.relative.name === 'index'
}
