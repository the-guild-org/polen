import { Path } from '@wollybeard/kit'

export interface PackagePaths {
  name: string
  isRunningFromSource: boolean
  static: {
    source: string
    build: string
  }
  rootDir: string
  sourceExtension: `.js` | `.ts`
  sourceDir: string
  template: {
    rootDir: string
    server: {
      app: string
      entrypoint: string
    }
    client: {
      entrypoint: string
    }
  }
}

const sourceDirRelativeExp = `src`
const buildDirRelativeExp = `build`

/**
 * Usually ./build but if running source then ./src
 */
const sourceDir = import.meta.dirname
const templateDir = Path.join(sourceDir, `template`)
const rootDir = Path.join(sourceDir, `..`)

const isRunningFromSource = sourceDir.endsWith(sourceDirRelativeExp)

const sourceKind = isRunningFromSource ? `.ts` : `.js`

export const packagePaths: PackagePaths = {
  name: `polen`,
  isRunningFromSource,
  static: {
    source: sourceDir,
    build: buildDirRelativeExp,
  },
  sourceExtension: sourceKind,
  rootDir: rootDir,
  sourceDir,
  template: {
    rootDir: templateDir,
    server: {
      app: Path.join(templateDir, `server/app.js`),
      entrypoint: Path.join(templateDir, `server/main.js`),
    },
    client: {
      entrypoint: Path.join(templateDir, `entry.client.jsx`),
    },
  },
}
