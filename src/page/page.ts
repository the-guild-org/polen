import { Fs } from '../lib/fs/_namespace.js'
import { Path } from '../lib/path/_namespace.js'
import { TinyGlobby } from '../lib/tiny-globby/_namespace.js'
import type { PagePlace } from './page-place.js'
import { filePathToPagePlace } from './page-place.js'

export interface Page {
  place: PagePlace
  content: string
}

export const readAll = async (): Promise<Page[]> => {
  const projectDir = process.cwd()
  const pagesDir = Path.join(projectDir, `pages`)
  const globPattern = Path.join(pagesDir, `**/*.md`)
  const filePaths = await TinyGlobby.glob(globPattern, { absolute: true })
  const pages = await Promise.all(filePaths.map(filePath => filePathToPage(filePath, pagesDir)))
  return pages
}

export const filePathToPage = async (filePath: string, rootDir: string): Promise<Page> => {
  const pagePlace = filePathToPagePlace(filePath, rootDir)
  const content = await Fs.readFile(filePath, `utf-8`)
  const page: Page = {
    place: pagePlace,
    content,
  }
  return page
}
