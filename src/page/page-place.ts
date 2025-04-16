import { Path } from '../lib/path/_namespace.js'

const indexRegex = /\/index\.\w+$/

export interface PagePlace {
  file: {
    path: string,
  }
  route: {
    type: `index` | `item`,
    path: string,
  }
}

export const filePathToPagePlace = (filePath: string, rootDir: string): PagePlace => {
  const filePathWithoutRoot = Path.relative(rootDir, filePath)
  const fileExt = Path.extname(filePathWithoutRoot)
  const dir = Path.dirname(filePathWithoutRoot)
  const isIndex = indexRegex.test(filePathWithoutRoot)
  const routePath = isIndex ? dir : Path.join(dir, Path.basename(filePathWithoutRoot, fileExt))
  const pagePlace: PagePlace = {
    file: {
      path: filePath,
    },
    route: {
      type: isIndex ? `index` : `item`,
      path: routePath,
    },
  }
  return pagePlace
}
