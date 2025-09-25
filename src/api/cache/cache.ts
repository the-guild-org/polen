import { Op, S } from '#dep/effect'
import { Ef } from '#dep/effect'
import { packagePaths } from '#package-paths'
import { debugPolen } from '#singletons/debug'
import { FileSystem } from '@effect/platform'
import { Fs, FsLoc } from '@wollybeard/kit'

const debug = debugPolen.sub(`api:cache`)

/**
 * Delete all Polen-generated caches.
 *
 * This includes:
 * - Framework development assets (node_modules/.vite/polen-assets in Polen's directory)
 * - Framework Vite cache (node_modules/.vite in Polen's directory)
 * - Project build output (build/)
 * - Project Vite cache (node_modules/.vite)
 */
export const deleteAll = (
  projectRoot: FsLoc.AbsDir,
): Ef.Effect<void, never, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const projectRootStr = FsLoc.encodeSync(projectRoot)
    debug(`deleteAll`, { projectRoot: projectRootStr })

    // Framework caches (Polen's internal caches)
    const frameworkCacheRoot = FsLoc.join(packagePaths.rootDir, FsLoc.fromString(`node_modules/.vite/`))
    const frameworkDevAssets = FsLoc.join(frameworkCacheRoot, FsLoc.fromString(`polen-assets/`))

    // Project caches
    const projectBuildDir = FsLoc.join(projectRoot, FsLoc.fromString(`build/`))
    const projectViteCache = FsLoc.join(projectRoot, FsLoc.fromString(`node_modules/.vite/`))

    const cachePaths = [
      frameworkDevAssets,
      frameworkCacheRoot,
      projectBuildDir,
      projectViteCache,
    ]

    // Delete all cache paths in parallel
    yield* Ef.all(
      cachePaths.map((cachePath) =>
        Fs.remove(cachePath, { recursive: true }).pipe(
          Ef.tap(() => Ef.sync(() => debug(`deleted`, { path: FsLoc.encodeSync(cachePath) }))),
          Ef.catchAll((error) =>
            Ef.sync(() => {
              // Ignore errors - cache directories might not exist
              debug(`deleteFailed`, { path: FsLoc.encodeSync(cachePath), error })
            })
          ),
        )
      ),
      { concurrency: 'unbounded' },
    )

    debug(`deleteAllComplete`)
    // FIXME: Remove cast when @effect/platform versions are aligned between @wollybeard/kit and Polen
  }) as any

// Types

export interface CacheInfo {
  rootPath: FsLoc.AbsDir
  developmentAssets: CacheEntry & {
    tree: Op.Option<TreeNode[]>
  }
  vite: CacheEntry & {
    optimizedDependencies: Op.Option<
      Array<{
        name: string
        size: number
      }>
    >
  }
}

interface CacheEntry {
  path: FsLoc.AbsDir
  exists: boolean
  size: Op.Option<number>
}

export interface TreeNode {
  name: string
  type: 'file' | 'directory'
  size: Op.Option<number>
  children: Op.Option<TreeNode[]>
}

// Helpers

const getDirectorySize = (dirPath: FsLoc.AbsDir): Ef.Effect<number, never, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    let totalSize = 0

    const entries = yield* Fs.read(dirPath).pipe(
      Ef.catchAll(() => {
        debug(`getDirectorySize:error`, { path: dirPath })
        return Ef.succeed([])
      }),
    )

    for (const entry of entries) {
      // Check the _tag to determine if it's a file or directory
      if (entry._tag === 'LocAbsDir') {
        // It's a directory, recurse
        const subSize = yield* getDirectorySize(entry)
        totalSize += subSize
      } else if (entry._tag === 'LocAbsFile') {
        // It's a file, get its size
        const fileInfo = yield* Fs.stat(entry).pipe(
          Ef.catchAll(() => Ef.succeed(null)),
        )
        if (fileInfo) {
          totalSize += Number(fileInfo.size)
        }
      }
    }

    return totalSize
  })

const buildDirectoryTree = (
  dirPath: FsLoc.AbsDir,
  currentDepth: number,
  maxDepth: number,
): Ef.Effect<TreeNode[], never, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    if (currentDepth >= maxDepth) {
      return []
    }

    const tree: TreeNode[] = []

    const entries = yield* Fs.read(dirPath).pipe(
      Ef.catchAll(() => {
        debug(`buildDirectoryTree:error`, { path: dirPath })
        return Ef.succeed([])
      }),
    )

    for (const entry of entries) {
      const name = FsLoc.name(entry)

      if (entry._tag === 'LocAbsDir') {
        const node: TreeNode = {
          name,
          type: 'directory',
          size: Op.none(),
          children: Op.none(),
        }

        if (currentDepth + 1 < maxDepth) {
          const children = yield* buildDirectoryTree(entry, currentDepth + 1, maxDepth)
          node.children = children.length > 0 ? Op.some(children) : Op.none()
        }

        tree.push(node)
      } else if (entry._tag === 'LocAbsFile') {
        // Get its size if needed
        const fileInfo = yield* Fs.stat(entry).pipe(
          Ef.catchAll(() => Ef.succeed(null)),
        )

        const node: TreeNode = {
          name,
          type: 'file',
          size: fileInfo ? Op.some(Number(fileInfo.size)) : Op.none(),
          children: Op.none(),
        }

        tree.push(node)
      }
    }

    return tree
  })

/**
 * Get information about Polen's internal caches.
 */
export const info = (
  options?: { depth?: number },
): Ef.Effect<CacheInfo, Error, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const depth = options?.depth ?? 2
    const cacheRoot = FsLoc.join(packagePaths.rootDir, FsLoc.fromString(`node_modules/.vite/`))
    const devAssetsPath = FsLoc.join(cacheRoot, FsLoc.fromString(`polen-assets/`))
    const depsPath = FsLoc.join(cacheRoot, FsLoc.fromString(`deps/`))

    debug(`info`, { cacheRoot: FsLoc.encodeSync(cacheRoot), depth })

    // Check development assets
    const devAssetsExists = yield* Fs.exists(devAssetsPath)
    const devAssetsSize = devAssetsExists
      ? yield* Ef.map(getDirectorySize(devAssetsPath), Op.some)
      : Op.none()
    const devAssetsTree = devAssetsExists
      ? yield* Ef.map(
        buildDirectoryTree(devAssetsPath, 0, depth),
        (tree) => tree.length > 0 ? Op.some(tree) : Op.none(),
      )
      : Op.none()

    // Check vite cache
    const viteExists = yield* Fs.exists(cacheRoot)
    const viteSize = viteExists
      ? yield* Ef.map(getDirectorySize(cacheRoot), Op.some)
      : Op.none()
    let optimizedDeps: Op.Option<Array<{ name: string; size: number }>> = Op.none()

    if (viteExists) {
      // Get optimized dependencies
      const depEntries = yield* Fs.read(depsPath).pipe(
        Ef.catchAll(() => Ef.succeed([])),
      )

      const deps: Array<{ name: string; size: number }> = []
      for (const entry of depEntries) {
        if (entry._tag === 'LocAbsFile') {
          const name = FsLoc.name(entry)
          if (name.endsWith('.js') && !name.startsWith('chunk-')) {
            const fileInfo = yield* Fs.stat(entry).pipe(
              Ef.catchAll(() => Ef.succeed(null)),
            )
            if (fileInfo) {
              deps.push({
                name: name.replace('.js', ''),
                size: Number(fileInfo.size),
              })
            }
          }
        }
      }

      // Sort by size descending
      deps.sort((a, b) => b.size - a.size)
      optimizedDeps = deps.length > 0 ? Op.some(deps) : Op.none()
    }

    return {
      rootPath: cacheRoot,
      developmentAssets: {
        path: devAssetsPath,
        exists: devAssetsExists,
        size: devAssetsSize,
        tree: devAssetsTree,
      },
      vite: {
        path: cacheRoot,
        exists: viteExists,
        size: viteSize,
        optimizedDependencies: optimizedDeps,
      },
    }
  })
