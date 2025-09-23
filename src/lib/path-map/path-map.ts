import { FsLoc } from '@wollybeard/kit'

/**
 * Special key added to path objects to reference the directory itself
 */
export const DIR_KEY = `$` as const

/**
 * Input type for path maps - plain nested objects with string values
 */
export interface PathInput {
  [key: string]: string | PathInput
}

/**
 * Processed paths with $ properties added to directories
 */
export type ProcessedPaths<$T> =
  & {
    [K in keyof $T]: $T[K] extends string ? string
      : ProcessedPaths<$T[K]> & { [DIR_KEY]: string }
  }
  & ($T extends PathInput ? { [DIR_KEY]: string } : {})

/**
 * Path map containing only relative paths
 */
export type RelativePathMap<$T extends PathInput = PathInput> = ProcessedPaths<$T>

/**
 * Path map containing paths rooted at the PathMap's origin
 */
export type RootedPathMap<$T extends PathInput = PathInput> = ProcessedPaths<$T>

/**
 * Path map containing absolute paths
 */
export type AbsolutePathMap<$T extends PathInput = PathInput> = ProcessedPaths<$T>

/**
 * Combined path map with relative, rooted, and absolute variants
 */
export interface PathMap<$T extends PathInput = PathInput> {
  /**
   * Paths relative to their parent directory
   * @example
   * paths.relative.template.server.app // 'app.ts'
   */
  relative: RelativePathMap<$T>

  /**
   * Paths from the PathMap's root
   * @example
   * paths.rooted.template.server.app // 'template/server/app.ts'
   */
  rooted: RootedPathMap<$T>

  /**
   * Absolute paths from the filesystem root
   * @example
   * paths.absolute.template.server.app // '/project/template/server/app.ts'
   */
  absolute: AbsolutePathMap<$T>

  /**
   * The base path used for absolute paths
   */
  base: string
}

/**
 * Create a path map from nested path definitions
 *
 * @param paths - Nested object structure defining paths
 * @param base - Optional base path for absolute paths
 * @returns RelativePathMap if no base provided, PathMap if base provided
 *
 * @example
 * ```ts
 * // Without base - returns RelativePathMap
 * const paths = PathMap.create({
 *   src: {
 *     lib: {
 *       utils: 'utils.ts'
 *     }
 *   }
 * })
 *
 * // With base - returns PathMap with all variants
 * const paths = PathMap.create({
 *   src: {
 *     lib: {
 *       utils: 'utils.ts'
 *     }
 *   }
 * }, '/project')
 *
 * paths.relative.src.lib.utils  // 'utils.ts'
 * paths.rooted.src.lib.utils    // 'src/lib/utils.ts'
 * paths.absolute.src.lib.utils  // '/project/src/lib/utils.ts'
 * ```
 */
export function create<T extends PathInput>(paths: T): RelativePathMap<T>
export function create<T extends PathInput>(paths: T, base: string): PathMap<T>
export function create<T extends PathInput>(paths: T, base?: string): RelativePathMap<T> | PathMap<T> {
  const relative = processRelativePaths(paths, [])

  if (!base) {
    return relative as RelativePathMap<T>
  }

  // Normalize base path - trim spaces, collapse multiple slashes, remove trailing
  const trimmedBase = base.trim()
  // Collapse multiple slashes to single, then remove trailing (unless it's just "/")
  const collapsedBase = trimmedBase.replace(/\/+/g, `/`)
  // Handle edge case where base is "/." - this should become "/"
  const cleanedBase = collapsedBase === `/.` ? `/` : collapsedBase
  const normalizedBase = cleanedBase === `/` ? `/` : cleanedBase.replace(/\/$/, ``)

  const rooted = processRootedPaths(paths, [])
  const absolute = processAbsolutePaths(paths, normalizedBase, [])

  return {
    relative: relative as RelativePathMap<T>,
    rooted: rooted as RootedPathMap<T>,
    absolute: absolute as AbsolutePathMap<T>,
    base: normalizedBase,
  }
}

/**
 * Create a new PathMap with a different base path
 *
 * @param pathMap - Existing PathMap or RelativePathMap
 * @param base - New base path
 * @returns New PathMap with updated absolute paths
 *
 * @example
 * ```ts
 * const dev = PathMap.create(paths, '/dev')
 * const prod = PathMap.rebase(dev, '/prod')
 *
 * prod.absolute.src.lib.utils // '/prod/src/lib/utils.ts'
 * ```
 */
export const rebase = <$T extends PathInput>(
  pathMap: PathMap<$T> | RelativePathMap<$T>,
  base: string,
): PathMap<$T> => {
  // Extract the input structure from the relative paths
  const input = extractInput(pathMap)
  return create(input, base) as PathMap<$T>
}

// Helper to process paths for relative variant (local to parent)
const processRelativePaths = (input: PathInput, currentPath: string[]): any => {
  const result: any = {}

  // Add $ property for directory (just the last segment)
  if (currentPath.length > 0) {
    result[DIR_KEY] = currentPath[currentPath.length - 1]
  } else {
    result[DIR_KEY] = `.`
  }

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === `string`) {
      result[key] = value
    } else {
      result[key] = processRelativePaths(value, [...currentPath, key])
    }
  }

  return result
}

// Helper to process paths for rooted variant (from PathMap root)
const processRootedPaths = (input: PathInput, currentPath: string[]): any => {
  const result: any = {}

  // Add $ property for directory (full path from root)
  result[DIR_KEY] = currentPath.length > 0 ? currentPath.join(`/`) : `.`

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === `string`) {
      // File: join current path with filename
      result[key] = currentPath.length > 0
        ? `${currentPath.join(`/`)}/${value}`
        : value
    } else {
      result[key] = processRootedPaths(value, [...currentPath, key])
    }
  }

  return result
}

// Helper to process paths for absolute variant
const processAbsolutePaths = (input: PathInput, base: string, currentPath: string[]): any => {
  const result: any = {}

  // Normalize base to not end with slash unless it's root
  const normalizedBase = base === `/` ? base : base.replace(/\/$/, ``)

  // Add $ property for directory
  const relativePath = currentPath.length > 0 ? currentPath.join(`/`) : ``
  const baseLoc = FsLoc.decodeSync(normalizedBase)
  const relativePathLoc = relativePath ? FsLoc.decodeSync(relativePath) : null
  result[DIR_KEY] = relativePathLoc
    ? FsLoc.encodeSync(FsLoc.join(baseLoc, relativePathLoc))
    : normalizedBase

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === `string`) {
      // File: join base + current path + filename
      const pathParts = [...currentPath, value]
      const fullPathLoc = FsLoc.join(baseLoc, FsLoc.decodeSync(pathParts.join('/')))
      result[key] = FsLoc.encodeSync(fullPathLoc)
    } else {
      result[key] = processAbsolutePaths(value, normalizedBase, [...currentPath, key])
    }
  }

  return result
}

// Helper to extract input structure from processed paths
const extractInput = (pathMap: any): PathInput => {
  const input: PathInput = {}

  // Get the source - could be relative from PathMap or the whole thing for RelativePathMap
  const source = `relative` in pathMap ? pathMap.relative : pathMap

  function extract(processed: any, target: PathInput) {
    for (const [key, value] of Object.entries(processed)) {
      if (key === DIR_KEY) continue

      if (typeof value === `string`) {
        target[key] = value
      } else {
        target[key] = {}
        extract(value, target[key])
      }
    }
  }

  extract(source, input)
  return input
}
