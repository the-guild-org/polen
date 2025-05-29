import { neverCase } from '@wollybeard/kit/language'
import type { PageBranch, PageTree } from './page.js'

const $ = {
  pages: `pages`,
  createRoute: `createRoute`,
  createRouteIndex: `createRouteIndex`,
}

const renderCodePageBranchBranches = (pageBranch: PageBranch): string[] => {
  return pageBranch.branches.map(renderCodePageBranchRoute)
}

const renderCodePageBranchRoute = (pageBranch: PageBranch): string => {
  switch (pageBranch.type) {
    case `PageBranchContent`: {
      if (pageBranch.route.isIndex) {
        // This is an index page, e.g., pages/foo/index.md becomes route /foo (index)
        return `
                  ${$.createRouteIndex}({
                    Component: () => ${pageBranch.content.html},
                  })
                `
      } else {
        // This is a regular content page, e.g., pages/bar.md becomes route /bar
        return `
                ${$.createRoute}({
                  path: '${pageBranch.route.path}',
                  Component: () => ${pageBranch.content.html},
                  children: [${renderCodePageBranchBranches(pageBranch).join(`,\\n`)}],
                })
              `
      }
    }
    case `PageBranchSegment`: {
      // This is a route segment created for a directory, e.g., pages/foo when foo/index.md doesn't exist but foo/bar.md does
      return `
                ${$.createRoute}({
                  path: '${pageBranch.route.path}',
                  children: [${renderCodePageBranchBranches(pageBranch).join(`,\\n`)}],
                })
              `
    }
    default: {
      return neverCase(pageBranch)
    }
  }
}

export const render = (parameters: {
  pageTree: PageTree
  sourcePaths: {
    reactRouterHelpers: string
  }
}): string => {
  return `
    import {
      ${$.createRoute},
      ${$.createRouteIndex}
    } from '${parameters.sourcePaths.reactRouterHelpers}'
    
    export const ${$.pages} = [
      ${parameters.pageTree.map(renderCodePageBranchRoute).join(`,\n`)}
    ]
  `
}
