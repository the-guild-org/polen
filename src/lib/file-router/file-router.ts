import { TinyGlobby } from '#dep/tiny-globby/index.js'

export type RoutePathSegment = string

export type RoutePath = RoutePathSegment[]

export interface RouteFile {
  path: {
    relative: string
    absolute: string
  }
}

export interface Route {
  path: RoutePath
  file: RouteFile
}

export type Diagnostic = DiagnosticIndexConflict

export interface DiagnosticIndexConflict {
  literal: {
    file: RouteFile
  }
  index: {
    file: RouteFile
  }
}

export interface ScanResult {
  routes: Route[]
  diagnostics: Diagnostic[]
}

// export type RouteList = Route[]

// export type RouteTree =

export const scan = async (parameters: {
  dir: string
  glob?: string
}): Promise<ScanResult> => {
  const { dir, glob = `**/*` } = parameters

  const paths = await TinyGlobby.glob(glob, {
    absolute: true,
    cwd: dir,
    onlyFiles: true,
  })

  const routes = paths.map(filePath => filePathToRoute(filePath, dir))

  return todo<ScanResult>()
}

const conventions = {
  index: {
    name: /\/index\.\w+$/,
  },
}

export const filePathToRoute = (filePathExpression: string, rootDir: string): Route => {
  return todo<Route>()
  // const file = {
  //   path: {
  //     absolute: Path.parse(filePathExpression),
  //     relative: Path.parse(Path.relative(rootDir, filePathExpression)),
  // }
  // const relative = Path.relative(rootDir, filePathExpression)
  // const ext = Path.extname(relative)
  // const dir = Path.dirname(relative)
  // const isIndex = conventions.index.name.test(relative)

  // if (isIndex) {
  // }

  // const routePathExplicit = Path.join(dir, Path.basename(relative, ext))
  // const routePath = isIndex ? dir : routePathExplicit
  // const route: RouteIndex | RouteItem = {
  //   type: isIndex ? `RouteIndex` : `RouteItem`,
  //   pathExplicit: routePathExplicit,
  //   path: {
  //     raw: routePath,
  //     segments: routePath.split(segmentSeparator),
  //   },
  // }
  // return route
}

// export const filePathToRoute = async (filePath: string, rootDir: string): Promise<FileRoute> => {
//   const route = filePathToRoute(filePath, rootDir)
//   const page: FileRoute = {
//     route,
//     file: {
//       path: filePath,
//     },
//   }
//   return page
// }

// export const pagesToPageBranches = (pages: Route[]): PageBranch[] => {
//   // Create a map of page paths to their corresponding PageTree objects
//   const pageBranchByRoutePath = new Map<string, PageBranch>()
//   // Array to store top-level pages (those without parents)
//   const topLevelPageTrees: PageBranch[] = []

//   const registerBranch = (pageBranch: PageBranch) => {
//     pageBranchByRoutePath.set(pageBranch.route.pathExplicit, pageBranch)
//   }

//   pages.forEach(page => {
//     registerBranch({
//       type: `PageBranchContent`,
//       ...page,
//       branches: [],
//     })
//   })

//   // For each page branch, connect it to its parent
//   pageBranchByRoutePath.forEach(pageBranch => {
//     if (isRouteTopLevel(pageBranch.route)) {
//       topLevelPageTrees.push(pageBranch)
//       return
//     }

//     const parentRoutePath = calcParentRoutePath(pageBranch.route)
//     let parent = pageBranchByRoutePath.get(parentRoutePath.raw)

//     // If there is no explicit parent then infer a route segment for its parent.
//     // This is analogous o "prefix routes" in React Router, see: https://reactrouter.com/start/data/routing#prefix-route
//     if (!parent) {
//       debug(`infer parent route`, parentRoutePath)
//       parent = {
//         type: `PageBranchSegment`,
//         route: {
//           type: `RouteSegment`,
//           path: parentRoutePath,
//           pathExplicit: parentRoutePath.raw,
//         },
//         branches: [],
//       }
//       registerBranch(parent)
//     }

//     parent.branches.push(pageBranch)
//   })

//   if (topLevelPageTrees.length === 0 && pageBranchByRoutePath.size > 0) {
//     throw new Error(`No top-level pages found`)
//   }

//   return topLevelPageTrees
// }

const todo = <type>(message = `todo`): type => {
  throw new Error(message)
}
