import { FsLoc } from '@wollybeard/kit'

export interface PackagePaths {
  name: string
  isRunningFromSource: boolean
  static: {
    source: FsLoc.AbsDir.AbsDir
    build: FsLoc.AbsDir.AbsDir
  }
  rootDir: FsLoc.AbsDir.AbsDir
  sourceExtension: typeof sourceExt
  sourceDir: FsLoc.AbsDir.AbsDir
  template: {
    absolute: {
      rootDir: FsLoc.AbsDir.AbsDir
      server: {
        app: FsLoc.AbsFile.AbsFile
        entrypoint: FsLoc.AbsFile.AbsFile
      }
      client: {
        entrypoint: FsLoc.AbsFile.AbsFile
      }
    }
    relative: {
      rootDir: FsLoc.RelDir.RelDir
      server: {
        app: FsLoc.RelFile.RelFile
        entrypoint: FsLoc.RelFile.RelFile
      }
      client: {
        entrypoint: FsLoc.RelFile.RelFile
      }
    }
  }
}

const l = FsLoc.fromString
const j = FsLoc.join

const buildDirRelativeExp = l(`build`)

/**
 * Usually ./build but if running source then ./src
 */
const sourceDir = FsLoc.AbsDir.decodeSync(import.meta.dirname)
const templateDir = FsLoc.join(sourceDir, l(`template`))
const rootDir = FsLoc.up(sourceDir)

const isRunningFromSource = FsLoc.encodeSync(sourceDir).endsWith('src')

const sourceExt = isRunningFromSource ? `.ts` : `.js`
const sourceExtJsx = isRunningFromSource ? `.tsx` : `.js`

const templateDirRelative = l(isRunningFromSource ? `src/template` : `build/template`)

export const packagePaths: PackagePaths = {
  name: `polen`,
  isRunningFromSource,
  static: {
    source: sourceDir,
    build: j(rootDir, buildDirRelativeExp),
  },
  sourceExtension: sourceExt,
  rootDir: rootDir,
  sourceDir: sourceDir,
  template: {
    absolute: {
      rootDir: templateDir,
      server: {
        app: j(templateDir, l(`server/app${sourceExt}`)),
        entrypoint: j(templateDir, l(`server/main${sourceExt}`)),
      },
      client: {
        entrypoint: j(
          templateDir,
          FsLoc.RelFile.decodeSync(`entry.client${isRunningFromSource ? `.tsx` : `.js`}`),
        ),
      },
    },
    relative: {
      rootDir: templateDirRelative,
      server: {
        app: j(templateDirRelative, l(`server/app${sourceExt}`)),
        entrypoint: j(templateDirRelative, l(`server/main${sourceExt}`)),
      },
      client: {
        entrypoint: j(templateDirRelative, l(`entry.client${sourceExtJsx}`)),
      },
    },
  },
}
