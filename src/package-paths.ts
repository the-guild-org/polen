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
    absolute: {
      rootDir: string
      server: {
        app: string
        entrypoint: string
      }
      client: {
        entrypoint: string
      }
    }
    relative: {
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

const templateDirRelative = isRunningFromSource ? `src/template` : `build/template`

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
    absolute: {
      rootDir: templateDir,
      server: {
        app: Path.join(templateDir, `server/app${sourceKind}`),
        entrypoint: Path.join(templateDir, `server/main${sourceKind}`),
      },
      client: {
        entrypoint: Path.join(templateDir, `entry.client${isRunningFromSource ? `.tsx` : `.js`}`),
      },
    },
    relative: {
      rootDir: templateDirRelative,
      server: {
        app: `${templateDirRelative}/server/app${sourceKind}`,
        entrypoint: `${templateDirRelative}/server/main${sourceKind}`,
      },
      client: {
        entrypoint: `${templateDirRelative}/entry.client${isRunningFromSource ? `.tsx` : `.js`}`,
      },
    },
  },
}
