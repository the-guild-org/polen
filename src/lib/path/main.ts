import * as NodePath from 'node:path'
export {
  basename,
  delimiter,
  dirname,
  extname,
  format,
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  resolve,
  sep,
  toNamespacedPath,
} from 'node:path'

/**
 * Make a path absolute if it isn't already
 *
 * @param filePath - The path to ensure is absolute
 * @param basePath - The base path to resolve against (defaults to current working directory)
 * @returns An absolute path
 */
export const absolutify = (filePath: string, basePath: string = process.cwd()): string => {
  return NodePath.isAbsolute(filePath)
    ? filePath
    : NodePath.resolve(basePath, filePath)
}
