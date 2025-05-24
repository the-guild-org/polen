import { Path } from '@wollybeard/kit'

export interface PackagePaths {
  rootDir: string
  sourceDir: string
  template: {
    rootDir: string
    entryServer: string
    entryClient: string
  }
}

/**
 * Usually build but if running with tsx then src
 */
const sourceDir = import.meta.dirname
const templateDir = Path.join(sourceDir, `template`)
const rootDir = Path.join(sourceDir, `..`)

export const packagePaths: PackagePaths = {
  rootDir: rootDir,
  sourceDir,
  template: {
    rootDir: templateDir,
    entryServer: Path.join(templateDir, `entry.server.jsx`),
    entryClient: Path.join(templateDir, `entry.client.jsx`),
  },
}
