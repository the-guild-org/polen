import { TinyGlobby } from '#dep/tiny-globby/index.js'
import { Debug } from '#lib/debug/index.js'
import { Path } from '@wollybeard/kit'

const debug = Debug.create(`lib:file-router`)

/**
 * Describes a route derived from a file.
 */
export interface Route {
  /**
   * Absolute path to the source file.
   * @example /path/to/project/pages/foo/bar.mdx
   */
  filePath: string
  /**
   * The URL-friendly path, relative to the base scanning directory.
   * For an index file at the root of `baseDir`, this will be "/".
   * @example "foo/bar"
   * @example "about"
   * @example "/" (for baseDir/index.mdx)
   */
  routePath: string
  /**
   * Indicates if the file is an index file (e.g., `index.mdx`).
   */
  isIndex: boolean
  /**
   * Segments of the `routePath`.
   * For a `routePath` of `""` (root index), this will be an empty array.
   * @example ["foo", "bar"]
   * @example ["about"]
   * @example []
   */
  pathSegments: string[]
  /**
   * The name of the file without its extension.
   * @example "bar" (for bar.mdx)
   * @example "index" (for index.mdx)
   */
  fileNameNoExt: string
  /**
   * The directory path of the file, relative to `baseDir`.
   * For a file directly in `baseDir`, this will be ".".
   * @example "foo" (for baseDir/foo/bar.mdx)
   * @example "." (for baseDir/index.mdx)
   */
  dirRelative: string
}

export interface ScanOptions {
  /**
   * The absolute path to the directory to scan.
   */
  baseDir: string
  /**
   * An array of file extensions to include in the scan (without the leading dot).
   * @example ["md", "mdx"]
   */
  extensions: string[]
}

/**
 * Scans a directory for files with specified extensions and converts them into route information.
 *
 * @param options - The scanning options.
 * @returns A promise that resolves to an array of `FileRouteInfo` objects, sorted by `routePath`.
 */
export const scan = async (options: ScanOptions): Promise<Route[]> => {
  const { baseDir, extensions } = options

  if (extensions.length === 0) {
    debug(`no extensions provided, returning empty array`)
    return []
  }

  const globPattern = `**/*.{${extensions.join(`,`)}}`
  debug(`scanning files`, { globPattern, baseDir })

  const filePaths = await TinyGlobby.glob(globPattern, {
    absolute: true,
    cwd: baseDir,
    onlyFiles: true,
  })
  debug(`found files`, { count: filePaths.length, paths: filePaths })

  const routeInfos: Route[] = []

  for (const filePath of filePaths) {
    const pathRelativeToBaseDir = Path.relative(baseDir, filePath) // e.g., foo/bar.mdx or index.mdx
    const fileExt = Path.extname(pathRelativeToBaseDir) // .mdx
    const dirRelative = Path.dirname(pathRelativeToBaseDir) // e.g., foo or . (if root)
    const fileNameNoExt = Path.basename(pathRelativeToBaseDir, fileExt) // e.g., bar or index

    let routePath: string
    const isIndexFile = fileNameNoExt === `index`

    if (isIndexFile) {
      // For "pages/index.md", dirRelative is ".", routePath becomes "/"
      // For "pages/about/index.md", dirRelative is "about", routePath becomes "about"
      routePath = dirRelative === `.` ? rootPath : dirRelative
    } else {
      // For "pages/contact.md", dirRelative is ".", routePath becomes "contact"
      // For "pages/blog/post1.md", dirRelative is "blog", routePath becomes "blog/post1"
      routePath = dirRelative === `.` ? fileNameNoExt : Path.join(dirRelative, fileNameNoExt)
    }

    // Path.join might produce './foo' if dirRelative is '.', normalize it
    if (routePath.startsWith(`.${Path.sep}`)) {
      routePath = routePath.substring(2)
    }

    // For the root path "/", segments should be an empty array.
    // For other paths like "foo" or "foo/bar", split normally.
    const pathSegments = routePath === rootPath ? [] : routePath.split(Path.sep)

    routeInfos.push({
      filePath,
      routePath,
      isIndex: isIndexFile,
      pathSegments,
      fileNameNoExt,
      dirRelative,
    })
  }

  // Sort for deterministic output, crucial for consistent processing and testing
  routeInfos.sort((a, b) => a.routePath.localeCompare(b.routePath))

  debug(`generated route infos`, routeInfos)
  return routeInfos
}

export const rootPath = `/`

export const isPathRoot = (path: string) => path === rootPath
