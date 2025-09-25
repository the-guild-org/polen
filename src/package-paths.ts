import { S } from '#dep/effect'
import { FsLoc } from '@wollybeard/kit'

export interface PackagePaths {
  name: string
  isRunningFromSource: boolean
  static: {
    source: FsLoc.AbsDir
    build: FsLoc.AbsDir
  }
  rootDir: FsLoc.AbsDir
  sourceExtension: typeof sourceExt
  sourceDir: FsLoc.AbsDir
  template: {
    absolute: {
      rootDir: FsLoc.AbsDir
      server: {
        app: FsLoc.AbsFile
        entrypoint: FsLoc.AbsFile
      }
      client: {
        entrypoint: FsLoc.AbsFile
      }
    }
    relative: {
      rootDir: FsLoc.RelDir
      server: {
        app: FsLoc.RelFile
        entrypoint: FsLoc.RelFile
      }
      client: {
        entrypoint: FsLoc.RelFile
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
const sourceDir = S.decodeSync(FsLoc.AbsDir.String)(import.meta.dirname)
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
          S.decodeSync(FsLoc.RelFile.String)(`entry.client${isRunningFromSource ? `.tsx` : `.js`}`),
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
