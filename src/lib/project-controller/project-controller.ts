import Fsj from 'fs-jetpack'
import type { PackageJson } from 'type-fest'
import type { Shell } from 'zx'
import { debug as debugBase } from '../debug/debug.js'
import type { Debug } from '../debug/index.js'
import { Path } from '../../lib-dependencies/path/index.js'
import { casesHandled } from '../prelude/main.js'
import type { LinkProtocol } from '../link-protocol.js'
import { FileStorage } from './file-system.js'

type ScriptRunner = (...args: any[]) => Promise<any>

type ScriptRunners = Record<string, ScriptRunner>

export const defaultTemplateMatch = [
  `**/*`,
  `!node_modules/**/*`,
  `!build/**/*`,
  `!dist/**/*`,
]

export interface ProjectController<
  // eslint-disable-next-line
  $ScriptRunners extends ScriptRunners = {},
> {
  fileStorage: FileStorage.FileStorage
  shell: Shell
  packageManager: Shell
  files: {
    packageJson: PackageJson,
  }
  run: $ScriptRunners
  /**
   * Directory path to this project.
   */
  dir: string
}

type ScaffoldInput = TemplateScaffoldInput | InitScaffold

interface TemplateScaffoldInput {
  type: `template`
  /**
   * Path to a directory whose contents will be used as the project template.
   *
   * Its files will be copied.
   */
  dir: string
  /**
   * @see https://www.npmjs.com/package/fs-jetpack#copyfrom-to-options
   */
  match?: string[]
}

interface InitScaffold {
  type: `init`
}

interface TemplateScaffold {
  type: `template`
  /**
   * Path to a directory whose contents will be used as the project template.
   *
   * Its files will be copied.
   */
  dir: string
  /**
   * @see https://www.npmjs.com/package/fs-jetpack#copyfrom-to-options
   */
  match: string[]
}

type Scaffold = TemplateScaffold | InitScaffold

interface ConfigInput<$ScriptRunners extends ScriptRunners = ScriptRunners> {
  debug?: Debug.Debug | undefined
  scripts?: ((project: ProjectController) => $ScriptRunners) | undefined
  /**
   * By default uses an "init" scaffold. This is akin to running e.g. `pnpm init`.
   */
  scaffold?: string | ScaffoldInput | undefined
  /**
   * @defaultValue `false`
   */
  install?: boolean | undefined
  links?: {
    dir: string,
    protocol: LinkProtocol,
  }[] | undefined
}

interface Config {
  debug: Debug.Debug
  scaffold: Scaffold
  install: boolean
}

const resolveConfigInput = (configInput: ConfigInput<any>): Config => {
  const debug = configInput.debug ?? debugBase

  const scaffold = typeof configInput.scaffold === `string`
    ? ({
      type: `template`,
      dir: configInput.scaffold,
      match: defaultTemplateMatch,
    } satisfies TemplateScaffoldInput)
    : configInput.scaffold?.type === `template`
    ? {
      ...configInput.scaffold,
      match: configInput.scaffold.match ?? defaultTemplateMatch,
    }
    : configInput.scaffold?.type === `init`
    ? ({ type: `init` } satisfies InitScaffold)
    : ({ type: `init` } satisfies InitScaffold)

  const install = configInput.install ?? false

  return {
    debug,
    scaffold,
    install,
  }
}

// eslint-disable-next-line
export const create = async <scriptRunners extends ScriptRunners = {}>(
  parameters: ConfigInput<scriptRunners>,
): Promise<ProjectController<scriptRunners>> => {
  const config = resolveConfigInput(parameters)

  const { debug } = config

  // utilities

  const fsj = await Fsj.tmpDirAsync()

  debug(`created temporary directory`, { path: fsj.cwd() })

  // import { $ } from 'zx'
  const { $ } = await import(`zx`)
  // const { $ } = require(`zx`)
  const shell = $({ cwd: fsj.cwd() })

  const pnpmShell = shell({ prefix: `pnpm ` })

  const fileStorage = FileStorage.create({ jetpack: fsj })

  // scaffold

  switch (config.scaffold.type) {
    case `template`: {
      const dir = config.scaffold.dir
      const matching = config.scaffold.match
      await Fsj.copyAsync(dir, fsj.cwd(), {
        matching,
        overwrite: true,
      })
      debug(`copied template`)
      break
    }
    case `init`: {
      const initPackageJson = {
        name: `project-${fsj.cwd()}`,
        packageManager: `pnpm@10.8.0`,
      }
      await fsj.writeAsync(`package.json`, initPackageJson)
      break
    }
    default: {
      casesHandled(config.scaffold)
    }
  }

  // files

  const packageJson = await fsj.readAsync(`package.json`, `json`) as PackageJson

  const files = {
    packageJson,
  }

  // instance

  const project: ProjectController<scriptRunners> = {
    shell,
    fileStorage,
    files,
    packageManager: pnpmShell,
    dir: fsj.cwd(),
    // Will be overwritten
    // eslint-disable-next-line
    run: undefined as any,
  }

  project.run = parameters.scripts?.(project) ?? {} as scriptRunners

  // Initialize

  // links

  for (const link of parameters.links ?? []) {
    const pathToLinkDirFromProject = Path.join(
      `..`,
      Path.relative(project.fileStorage.cwd, link.dir),
    )
    debug(`install link`, link)

    switch (link.protocol) {
      case `link`: {
        await project.packageManager`add ${`link:` + pathToLinkDirFromProject}`
        break
      }
      case `file`: {
        await project.packageManager`add ${`file:` + pathToLinkDirFromProject}`
        break
      }
      default: {
        casesHandled(link.protocol)
      }
    }
  }

  // init

  // install

  if (parameters.install) {
    await project.packageManager`install`
    debug(`installed dependencies`)
  }

  // return

  return project
}
