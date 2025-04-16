import Fsj from 'fs-jetpack'
import type { FSJetpack } from 'fs-jetpack/types.js'
import type { PackageJson } from 'type-fest'
import { $, type Shell } from 'zx'
import { debug as debugBase } from '../debug/debug.js'
import type { Debug } from '../debug/_namespace.js'
import { Path } from '../path/_namespace.js'
import { casesHandled } from '../prelude/main.js'
import type { LinkProtocol } from '../../../examples/_tests/helpers/link-protocol.js'

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
  $ScriptFunctions extends ScriptRunners = {},
> {
  dir: string
  fs: FSJetpack
  shell: Shell
  packageManager: Shell
  files: {
    packageJson: PackageJson,
  }
  run: $ScriptFunctions
}

// eslint-disable-next-line
export const create = async <scriptFunctions extends ScriptRunners = {}>(parameters: {
  template?: string | {
    dir: string,
    /**
     * @see https://www.npmjs.com/package/fs-jetpack#copyfrom-to-options
     */
    match: string[],
  } | undefined,
  debug?: Debug.Debug | undefined,
  scripts?: ((project: ProjectController) => scriptFunctions) | undefined,
  /**
   * @defaultValue `true`
   */
  install?: boolean | undefined,
  links?: {
    dir: string,
    protocol: LinkProtocol,
  }[] | undefined,
}): Promise<ProjectController<scriptFunctions>> => {
  const debug = parameters.debug ?? debugBase

  // utilities

  const fs = await Fsj.tmpDirAsync()
  debug(`created temporary directory`, { path: fs.cwd() })

  const shell = $({ cwd: fs.cwd() })

  const pnpmShell = shell({ prefix: `pnpm` })

  // template

  if (parameters.template) {
    const dir = typeof parameters.template === `string`
      ? parameters.template
      : parameters.template.dir
    const matching = typeof parameters.template === `string`
      ? defaultTemplateMatch
      : parameters.template.match
    await Fsj.copyAsync(dir, fs.cwd(), {
      matching,
    })
    debug(`copied template`)
  }

  // files

  const packageJson = await fs.readAsync(`package.json`, `json`) as PackageJson

  const files = {
    packageJson,
  }

  // instance

  const project: ProjectController<scriptFunctions> = {
    shell: shell,
    fs: fs,
    dir: fs.cwd(),
    files,
    packageManager: pnpmShell,
    // Will be overwritten
    // eslint-disable-next-line
    run: undefined as any,
  }

  project.run = parameters.scripts?.(project) ?? {} as scriptFunctions

  // Initialize

  // links

  for (const link of parameters.links ?? []) {
    const pathToLinkDirFromProject = Path.join(`..`, Path.relative(project.dir, link.dir))
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

  // install

  if (parameters.install !== false) {
    await project.packageManager`install`
    debug(`installed dependencies`)
  }

  // return

  return project
}
