import { casesHandled } from '#lib/prelude/main.js'
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
      switch (pageBranch.route.type) {
        case `RouteItem`:
          return `
                ${$.createRoute}({
                  path: '${pageBranch.route.path.raw}',
                  Component: () => ${pageBranch.content.html},
                  children: [${renderCodePageBranchBranches(pageBranch).join(`,\n`)}],
                })
              `
        case `RouteIndex`:
          return `
                    ${$.createRouteIndex}({
                      Component: () => ${pageBranch.content.html},
                    })
                  `
        default:
          return casesHandled(pageBranch.route)
      }
    }
    case `PageBranchSegment`: {
      return `
                ${$.createRoute}({
                  path: '${pageBranch.route.path.raw}',
                  children: [${renderCodePageBranchBranches(pageBranch).join(`,\n`)}],
                })
              `
    }
    default: {
      return casesHandled(pageBranch)
    }
  }
}

export const render = (parameters: {
  pageTree: PageTree,
  sourcePaths: {
    reactRouterHelpers: string,
  },
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
