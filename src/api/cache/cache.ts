import { O, S } from '#dep/effect'
import { packagePaths } from '#package-paths'
import { debugPolen } from '#singletons/debug'
import { FileSystem } from '@effect/platform'
import { Path } from '@wollybeard/kit'
import { Effect } from 'effect'

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
  projectRoot: string,
): Effect.Effect<void, never, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    debug(`deleteAll`, { projectRoot })
    const fs = yield* FileSystem.FileSystem

    // Framework caches (Polen's internal caches)
    const frameworkCacheRoot = Path.join(packagePaths.rootDir, `node_modules`, `.vite`)
    const frameworkDevAssets = Path.join(frameworkCacheRoot, `polen-assets`)

    // Project caches
    const projectBuildDir = Path.join(projectRoot, `build`)
    const projectViteCache = Path.join(projectRoot, `node_modules`, `.vite`)

    const cachePaths = [
      frameworkDevAssets,
      frameworkCacheRoot,
      projectBuildDir,
      projectViteCache,
    ]

    // Delete all cache paths in parallel
    yield* Effect.all(
      cachePaths.map((cachePath) =>
        fs.remove(cachePath, { recursive: true }).pipe(
          Effect.tap(() => Effect.sync(() => debug(`deleted`, { path: cachePath }))),
          Effect.catchAll((error) =>
            Effect.sync(() => {
              // Ignore errors - cache directories might not exist
              debug(`deleteFailed`, { path: cachePath, error })
            })
          ),
        )
      ),
      { concurrency: 'unbounded' },
    )

    debug(`deleteAllComplete`)
  })

// Types

export interface CacheInfo {
  rootPath: string
  developmentAssets: CacheEntry & {
    tree: O.Option<TreeNode[]>
  }
  vite: CacheEntry & {
    optimizedDependencies: O.Option<
      Array<{
        name: string
        size: number
      }>
    >
  }
}

interface CacheEntry {
  path: string
  exists: boolean
  size: O.Option<number>
}

export interface TreeNode {
  name: string
  type: 'file' | 'directory'
  size: O.Option<number>
  children: O.Option<TreeNode[]>
}

// Helpers

const getDirectorySize = (dirPath: string): Effect.Effect<number, never, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    let totalSize = 0

    const entries = yield* fs.readDirectory(dirPath).pipe(
      Effect.catchAll(() => {
        debug(`getDirectorySize:error`, { path: dirPath })
        return Effect.succeed([])
      }),
    )

    for (const entry of entries) {
      const fullPath = Path.join(dirPath, entry)
      const fileInfo = yield* fs.stat(fullPath).pipe(
        Effect.map(O.some),
        Effect.catchAll(() => Effect.succeed(O.none())),
      )

      yield* O.match(fileInfo, {
        onNone: () => Effect.succeed(undefined),
        onSome: (info) => {
          if (info.type === 'Directory') {
            return Effect.map(getDirectorySize(fullPath), (subSize) => {
              totalSize += subSize
            })
          } else if (info.type === 'File') {
            totalSize += Number(info.size)
            return Effect.succeed(undefined)
          }
          return Effect.succeed(undefined)
        },
      })
    }

    return totalSize
  })

const buildDirectoryTree = (
  dirPath: string,
  currentDepth: number,
  maxDepth: number,
): Effect.Effect<TreeNode[], never, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    if (currentDepth >= maxDepth) {
      return []
    }

    const fs = yield* FileSystem.FileSystem
    const tree: TreeNode[] = []

    const entries = yield* fs.readDirectory(dirPath).pipe(
      Effect.catchAll(() => {
        debug(`buildDirectoryTree:error`, { path: dirPath })
        return Effect.succeed([])
      }),
    )

    for (const entryName of entries) {
      const fullPath = Path.join(dirPath, entryName)
      const fileInfo = yield* fs.stat(fullPath).pipe(
        Effect.map(O.some),
        Effect.catchAll(() => Effect.succeed(O.none())),
      )

      yield* O.match(fileInfo, {
        onNone: () => Effect.succeed(undefined),
        onSome: (info) =>
          Effect.gen(function*() {
            const node: TreeNode = {
              name: entryName,
              type: info.type === 'Directory' ? 'directory' : 'file',
              size: info.type === 'File' ? O.some(Number(info.size)) : O.none(),
              children: O.none(),
            }

            if (info.type === 'Directory' && currentDepth + 1 < maxDepth) {
              const children = yield* buildDirectoryTree(fullPath, currentDepth + 1, maxDepth)
              node.children = children.length > 0 ? O.some(children) : O.none()
            }

            tree.push(node)
          }),
      })
    }

    return tree
  })

/**
 * Get information about Polen's internal caches.
 */
export const info = (
  options?: { depth?: number },
): Effect.Effect<CacheInfo, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const depth = options?.depth ?? 2
    const cacheRoot = Path.join(packagePaths.rootDir, `node_modules`, `.vite`)
    const devAssetsPath = Path.join(cacheRoot, `polen-assets`)
    const depsPath = Path.join(cacheRoot, `deps`)

    debug(`info`, { cacheRoot, depth })

    // Check development assets
    const devAssetsExists = yield* fs.exists(devAssetsPath)
    const devAssetsSize = devAssetsExists
      ? yield* Effect.map(getDirectorySize(devAssetsPath), O.some)
      : O.none()
    const devAssetsTree = devAssetsExists
      ? yield* Effect.map(buildDirectoryTree(devAssetsPath, 0, depth), (tree) =>
        tree.length > 0 ? O.some(tree) : O.none())
      : O.none()

    // Check vite cache
    const viteExists = yield* fs.exists(cacheRoot)
    const viteSize = viteExists
      ? yield* Effect.map(getDirectorySize(cacheRoot), O.some)
      : O.none()
    let optimizedDeps: O.Option<Array<{ name: string; size: number }>> = O.none()

    if (viteExists) {
      // Get optimized dependencies
      const depFiles = yield* fs.readDirectory(depsPath).pipe(
        Effect.catchAll(() =>
          Effect.succeed([])
        ),
      )

      const deps: Array<{ name: string; size: number }> = []
      for (const file of depFiles) {
        if (file.endsWith('.js') && !file.startsWith('chunk-')) {
          const filePath = Path.join(depsPath, file)
          const fileInfo = yield* fs.stat(filePath).pipe(
            Effect.map(O.some),
            Effect.catchAll(() => Effect.succeed(O.none())),
          )

          yield* O.match(fileInfo, {
            onNone: () => Effect.succeed(undefined),
            onSome: (info) => {
              if (info.type === 'File') {
                deps.push({
                  name: file.replace('.js', ''),
                  size: Number(info.size),
                })
              }
              return Effect.succeed(undefined)
            },
          })
        }
      }

      // Sort by size descending
      deps.sort((a, b) => b.size - a.size)
      optimizedDeps = deps.length > 0 ? O.some(deps) : O.none()
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
