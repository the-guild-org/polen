import { S } from 'graphql-kit'
import { packagePaths } from '#package-paths'
import { debugPolen } from '#singletons/debug'
import { FileSystem } from '@effect/platform'
import { NodeFileSystem } from '@effect/platform-node'
import { Effect } from 'effect'
import * as NodePath from 'node:path'

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
export const deleteAll = async (projectRoot: string): Promise<void> => {
  const deleteAllEffect = Effect.gen(function*() {
    debug(`deleteAll`, { projectRoot })
    const fs = yield* FileSystem.FileSystem

    // Framework caches (Polen's internal caches)
    const frameworkCacheRoot = NodePath.join(packagePaths.rootDir, `node_modules`, `.vite`)
    const frameworkDevAssets = NodePath.join(frameworkCacheRoot, `polen-assets`)

    // Project caches
    const projectBuildDir = NodePath.join(projectRoot, `build`)
    const projectViteCache = NodePath.join(projectRoot, `node_modules`, `.vite`)

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

  return Effect.runPromise(
    deleteAllEffect.pipe(
      Effect.provide(NodeFileSystem.layer),
    ),
  )
}

// Types

export interface CacheInfo {
  rootPath: string
  developmentAssets: CacheEntry & {
    tree?: TreeNode[] | undefined
  }
  vite: CacheEntry & {
    optimizedDependencies?:
      | Array<{
        name: string
        size: number
      }>
      | undefined
  }
}

interface CacheEntry {
  path: string
  exists: boolean
  size?: number | undefined
}

export interface TreeNode {
  name: string
  type: 'file' | 'directory'
  size?: number | undefined
  children?: TreeNode[] | undefined
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
      const fullPath = NodePath.join(dirPath, entry)
      const fileInfo = yield* fs.stat(fullPath).pipe(
        Effect.catchAll(() => Effect.succeed(null)),
      )

      if (fileInfo) {
        if (fileInfo.type === 'Directory') {
          const subSize = yield* getDirectorySize(fullPath)
          totalSize += subSize
        } else if (fileInfo.type === 'File') {
          totalSize += Number(fileInfo.size)
        }
      }
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
      const fullPath = NodePath.join(dirPath, entryName)
      const fileInfo = yield* fs.stat(fullPath).pipe(
        Effect.catchAll(() => Effect.succeed(null)),
      )

      if (fileInfo) {
        const node: TreeNode = {
          name: entryName,
          type: fileInfo.type === 'Directory' ? 'directory' : 'file',
        }

        if (fileInfo.type === 'File') {
          node.size = Number(fileInfo.size)
        }

        if (fileInfo.type === 'Directory' && currentDepth + 1 < maxDepth) {
          const children = yield* buildDirectoryTree(fullPath, currentDepth + 1, maxDepth)
          node.children = children
        }

        tree.push(node)
      }
    }

    return tree
  })

/**
 * Get information about Polen's internal caches.
 */
export const info = async (options?: { depth?: number }): Promise<CacheInfo> => {
  const infoEffect = Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const depth = options?.depth ?? 2
    const cacheRoot = NodePath.join(packagePaths.rootDir, `node_modules`, `.vite`)
    const devAssetsPath = NodePath.join(cacheRoot, `polen-assets`)
    const depsPath = NodePath.join(cacheRoot, `deps`)

    debug(`info`, { cacheRoot, depth })

    // Check development assets
    const devAssetsExists = yield* fs.exists(devAssetsPath)
    let devAssetsSize: number | undefined
    let devAssetsTree: TreeNode[] | undefined

    if (devAssetsExists) {
      devAssetsSize = yield* getDirectorySize(devAssetsPath)
      devAssetsTree = yield* buildDirectoryTree(devAssetsPath, 0, depth)
    }

    // Check vite cache
    const viteExists = yield* fs.exists(cacheRoot)
    let viteSize: number | undefined
    let optimizedDeps: Array<{ name: string; size: number }> | undefined

    if (viteExists) {
      viteSize = yield* getDirectorySize(cacheRoot)

      // Get optimized dependencies
      const depFiles = yield* fs.readDirectory(depsPath).pipe(
        Effect.catchAll(() => Effect.succeed([])),
      )

      optimizedDeps = []
      for (const file of depFiles) {
        if (file.endsWith('.js') && !file.startsWith('chunk-')) {
          const filePath = NodePath.join(depsPath, file)
          const fileInfo = yield* fs.stat(filePath).pipe(
            Effect.catchAll(() => Effect.succeed(null)),
          )

          if (fileInfo && fileInfo.type === 'File') {
            optimizedDeps.push({
              name: file.replace('.js', ''),
              size: Number(fileInfo.size),
            })
          }
        }
      }

      // Sort by size descending
      optimizedDeps.sort((a, b) => b.size - a.size)
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

  return Effect.runPromise(
    infoEffect.pipe(
      Effect.provide(NodeFileSystem.layer),
    ),
  )
}
