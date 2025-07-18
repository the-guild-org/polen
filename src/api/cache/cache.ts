import { packagePaths } from '#package-paths'
import { debugPolen } from '#singletons/debug'
import * as NodeFs from 'node:fs/promises'
import * as NodePath from 'node:path'

const debug = debugPolen.sub(`api:cache`)

/**
 * Delete all Polen-generated caches.
 *
 * This includes:
 * - Development assets (polen-assets)
 * - Build output (dist)
 * - Vite cache (.vite)
 */
export const deleteAll = async (projectRoot: string): Promise<void> => {
  debug(`deleteAll`, { projectRoot })

  const cachePaths = [
    NodePath.join(projectRoot, `polen-assets`),
    NodePath.join(projectRoot, `dist`),
    NodePath.join(projectRoot, `node_modules`, `.vite`),
  ]

  const deletionPromises = cachePaths.map(async (cachePath) => {
    try {
      await NodeFs.rm(cachePath, { recursive: true, force: true })
      debug(`deleted`, { path: cachePath })
    } catch (error) {
      // Ignore errors - cache directories might not exist
      debug(`deleteFailed`, { path: cachePath, error })
    }
  })

  await Promise.all(deletionPromises)
  debug(`deleteAllComplete`)
}

// Types

export interface CacheInfo {
  rootPath: string
  developmentAssets: CacheEntry & {
    tree?: TreeNode[]
  }
  vite: CacheEntry & {
    optimizedDependencies?: Array<{
      name: string
      size: number
    }>
  }
}

interface CacheEntry {
  path: string
  exists: boolean
  size?: number
}

export interface TreeNode {
  name: string
  type: 'file' | 'directory'
  size?: number
  children?: TreeNode[]
}

// Helpers

const getDirectorySize = async (dirPath: string): Promise<number> => {
  let totalSize = 0

  try {
    const entries = await NodeFs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = NodePath.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        totalSize += await getDirectorySize(fullPath)
      } else {
        const stats = await NodeFs.stat(fullPath)
        totalSize += stats.size
      }
    }
  } catch (error) {
    debug(`getDirectorySize:error`, { path: dirPath, error })
  }

  return totalSize
}

const buildDirectoryTree = async (
  dirPath: string,
  currentDepth: number,
  maxDepth: number,
): Promise<TreeNode[]> => {
  if (currentDepth >= maxDepth) {
    return []
  }

  const tree: TreeNode[] = []

  try {
    const entries = await NodeFs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = NodePath.join(dirPath, entry.name)
      const node: TreeNode = {
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
      }

      if (entry.isFile()) {
        try {
          const stats = await NodeFs.stat(fullPath)
          node.size = stats.size
        } catch {
          // Ignore stat errors
        }
      }

      if (entry.isDirectory() && currentDepth + 1 < maxDepth) {
        node.children = await buildDirectoryTree(fullPath, currentDepth + 1, maxDepth)
      }

      tree.push(node)
    }
  } catch (error) {
    debug(`buildDirectoryTree:error`, { path: dirPath, error })
  }

  return tree
}

/**
 * Get information about Polen's internal caches.
 */
export const info = async (options?: { depth?: number }): Promise<CacheInfo> => {
  const depth = options?.depth ?? 2
  const cacheRoot = NodePath.join(packagePaths.rootDir, `node_modules`, `.vite`)
  const devAssetsPath = NodePath.join(cacheRoot, `polen-assets`)
  const depsPath = NodePath.join(cacheRoot, `deps`)

  debug(`info`, { cacheRoot, depth })

  // Check development assets
  let devAssetsExists = false
  let devAssetsSize: number | undefined
  let devAssetsTree: TreeNode[] | undefined

  try {
    await NodeFs.access(devAssetsPath)
    devAssetsExists = true
    devAssetsSize = await getDirectorySize(devAssetsPath)
    devAssetsTree = await buildDirectoryTree(devAssetsPath, 0, depth)
  } catch {
    // Directory doesn't exist
  }

  // Check vite cache
  let viteExists = false
  let viteSize: number | undefined
  let optimizedDeps: Array<{ name: string; size: number }> | undefined

  try {
    await NodeFs.access(cacheRoot)
    viteExists = true
    viteSize = await getDirectorySize(cacheRoot)

    // Get optimized dependencies
    try {
      const depFiles = await NodeFs.readdir(depsPath)
      optimizedDeps = []

      for (const file of depFiles) {
        if (file.endsWith('.js') && !file.startsWith('chunk-')) {
          const filePath = NodePath.join(depsPath, file)
          const stats = await NodeFs.stat(filePath)
          optimizedDeps.push({
            name: file.replace('.js', ''),
            size: stats.size,
          })
        }
      }

      // Sort by size descending
      optimizedDeps.sort((a, b) => b.size - a.size)
    } catch {
      // deps directory doesn't exist
    }
  } catch {
    // Cache doesn't exist
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
}
