import { Tree } from '#lib/tree/index'
import { Str } from '@wollybeard/kit'
import * as FileRouter from '../file-router.ts'
import type { RouteTreeNode } from '../scan-tree.ts'
import type { ItemLink, ItemSection, Sidebar } from './types.ts'

export * from './types.ts'

/**
 * Build sidebar from tree structure
 */
export const buildFromTree = (routeTree: RouteTreeNode, basePath: FileRouter.Path): Sidebar => {
  const links: ItemLink[] = []
  const sections: ItemSection[] = []

  // Process only the children of the root node
  for (const child of routeTree.children) {
    processNode(child, basePath, [], links, sections)
  }

  const items = [...links, ...sections]

  return {
    items,
  }
}

const processNode = (
  node: RouteTreeNode,
  basePath: FileRouter.Path,
  parentPath: string[],
  links: ItemLink[],
  sections: ItemSection[],
): void => {
  const currentPath = [...parentPath, node.value.name]

  if (node.value.type === 'directory') {
    // This is a directory - create a section
    const sectionPath = [...basePath, ...currentPath]
    const sectionPathExp = FileRouter.pathToExpression(sectionPath)
    const sectionTitle = Str.titlizeSlug(node.value.name)

    const section: ItemSection = {
      type: `ItemSection`,
      title: sectionTitle,
      pathExp: sectionPathExp.startsWith('/') ? sectionPathExp.slice(1) : sectionPathExp,
      isLinkToo: false,
      links: [],
    }

    // Check if this directory has an index file
    const indexChild = node.children.find(child => child.value.type === 'file' && child.value.name === 'index')
    if (indexChild) {
      section.isLinkToo = true
    }

    // Process all non-index children as links for this section
    for (const child of node.children) {
      if (child.value.type === 'file' && child.value.name !== 'index' && child.value.route) {
        // Pass the parent path of the route, not the section path
        const routeParentPath = child.value.route.logical.path.slice(0, -1)
        section.links.push(routeToItemLink(child.value.route, routeParentPath))
      } else if (child.value.type === 'directory') {
        // Recursively process subdirectories
        // Note: This creates nested sections which the original implementation doesn't support
        // For now, we'll just add the files from subdirectories to the parent section
        collectFilesFromDirectory(child, child.value.route?.logical.path || [], section.links)
      }
    }

    sections.push(section)
  } else if (node.value.type === 'file' && node.value.route) {
    // This is a top-level file - add as nav
    if (node.value.name !== 'index') {
      links.push(routeToItemLink(node.value.route, basePath))
    }
  }
}

const collectFilesFromDirectory = (
  node: RouteTreeNode,
  basePath: FileRouter.Path,
  links: ItemLink[],
): void => {
  Tree.visit(node, (n) => {
    if (n.value.type === 'file' && n.value.route && n.value.name !== 'index') {
      // Use the route's parent path for relative title generation
      const routeParentPath = n.value.route.logical.path.slice(0, -1)
      links.push(routeToItemLink(n.value.route, routeParentPath))
    }
  })
}

const routeToItemLink = (route: FileRouter.Route, basePath: FileRouter.Path): ItemLink => {
  const pagePathExp = FileRouter.routeToPathExpression(route)
  const pageRelative = FileRouter.makeRelativeUnsafe(route, basePath)
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
