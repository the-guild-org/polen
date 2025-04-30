import { Path } from '../../lib-dependencies/path/index.js'

export namespace DirectoryLayout {
  // eslint-ignore
  export interface Tree {
    [path: string]: TreeLeaf
  }

  export type TreeLeaf = TreeLeafDirectory | TreeLeafFile
  export type TreeLeafDirectory = Tree
  export type TreeLeafFile = string

  export const TreeLeafTypeEnum = {
    directory: `directory`,
    file: `file`,
  } as const

  export type TreeLeafType = keyof typeof TreeLeafTypeEnum

  export type DirectoryLayoutFlat = Record<string, string>

  export type Content = string

  export const isLeafTypeFile = (value: unknown): value is TreeLeafFile => typeof value === `string`

  export const isLeafTypeDir = (value: unknown): value is TreeLeafDirectory => isPlainObject(value)

  export const getLeafType = (leaf: TreeLeaf): TreeLeafType => {
    if (isLeafTypeFile(leaf)) return TreeLeafTypeEnum.file
    if (isLeafTypeDir(leaf)) return TreeLeafTypeEnum.directory
    throw new Error(`Unknown kind of leaf.`)
  }

  export const makePath = (
    dir: Tree,
    segments: string[],
  ): TreeLeafDirectory => {
    let currentDir = dir

    for (const segment of segments) {
      if (currentDir[segment] === undefined) {
        currentDir[segment] = {}
        currentDir = currentDir[segment]
      } else {
        const newCurrentDir = currentDir[segment]
        if (isLeafTypeFile(newCurrentDir)) {
          throw new Error(`file where directory trying to be created: \${currentDir[segment]}`)
        }
        currentDir = newCurrentDir
      }
    }

    return currentDir
  }

  export type NormalizeToTree<Tree> = Tree

  export const normalizeToTree = <directoryLayout extends Tree>(
    directoryLayout: directoryLayout,
    baseDir: Tree = {},
  ): NormalizeToTree<directoryLayout> => {
    for (const [path, contentOrDirectory] of Object.entries(directoryLayout)) {
      const pathSegments = Path.posix.normalize(path).split(Path.posix.sep)
      if (isLeafTypeFile(contentOrDirectory)) {
        const fileName = pathSegments.pop()
        if (!fileName) {
          throw new Error(`invalid path: \${path}`)
        }
        const fileParentDir = makePath(baseDir, pathSegments)
        fileParentDir[fileName] = contentOrDirectory
      } else {
        normalizeToTree(contentOrDirectory, makePath(baseDir, pathSegments))
      }
    }
    return baseDir as any
  }

  export type NormalizeToFlat<$FileLayout, $Base extends string = ``> = {
    [k in keyof $FileLayout & string as `${$Base}${k}`]: $FileLayout[k] extends string
      ? $FileLayout[k]
      : k
  }

  export const normalizeToFlat = <directoryLayout extends Tree>(
    directoryLayout: directoryLayout,
    basePath = ``,
  ): NormalizeToFlat<directoryLayout> => {
    return Object.fromEntries(
      Object.entries(directoryLayout).flatMap(
        ([path, contentOrDirectory]): [path: string, content: string][] => {
          const fullPath = Path.join(basePath, path)

          if (isLeafTypeFile(contentOrDirectory)) {
            return [[fullPath, contentOrDirectory]]
          }

          return Object.entries(normalizeToFlat(contentOrDirectory, fullPath))
        },
      ),
    ) as any
  }
}

const isPlainObject = (value: unknown) => typeof value === `object` && value !== null
