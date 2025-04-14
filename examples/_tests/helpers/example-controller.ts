import type { PackageJson } from 'type-fest'
import Fsj from 'fs-jetpack'
import { Path } from '../../../src/lib/path/_namespace.js'
import { Url } from '../../../src/lib/url/_namespace.js'
import type { Shell } from 'zx'
import { $ } from 'zx'
import type { FSJetpack } from 'fs-jetpack/types.js'
import type { ExampleName } from './example-name.js'
import { debug } from '../../../src/lib/debug/debug.js'
import { type Ver, npmVerPattern } from './ver.js'
import type { ViteUserConfigWithPolen } from '../../../src/createConfiguration.js'

const selfPath = Url.fileURLToPath(import.meta.url)
const selfDir = Path.dirname(selfPath)
const projectDir = Path.join(selfDir, `../../../`)
const examplesDir = Path.join(projectDir, `/examples`)

export namespace ExampleController {
  export interface ExampleController {
    name: ExampleName
    shell: Shell
    fs: FSJetpack
    config: ViteUserConfigWithPolen
    packageJson: PackageJson
  }

  /**
   * Create a temporary directory with teh contents of the chosen example.
   */
  export const create = async (parameters: {
    exampleName: ExampleName,
    debug?: boolean,
    polenVer?: Ver,
  }) => {
    const debugMode = parameters.debug ?? false
    debug.toggle(debugMode)

    debug(`creating example`, { name: parameters.exampleName })

    const exampleDir = Path.join(examplesDir, parameters.exampleName)
    await Fsj.removeAsync(Path.join(exampleDir, `dist`))
    await Fsj.removeAsync(Path.join(exampleDir, `node_modules`))

    const exampleFs = await Fsj.tmpDirAsync()
    debug(`created temporary directory`, { path: exampleFs.cwd() })

    const exampleShell = $({ cwd: exampleFs.cwd() })

    await Fsj.copyAsync(exampleDir, exampleFs.cwd(), { overwrite: true })
    debug(`copied example`)

    const pathToPolenSourceCodeFromExample = `../` + Path.relative(exampleFs.cwd(), projectDir)

    if (parameters.polenVer) {
      switch (parameters.polenVer) {
        case `link`: {
          await exampleShell`pnpm add ${`link:` + pathToPolenSourceCodeFromExample}`
          debug(`install polen as link dependency`)
          break
        }
        case `file`: {
          await exampleShell`pnpm add ${`file:` + pathToPolenSourceCodeFromExample}`
          debug(`install polen as file dependency`)
          break
        }
        default: {
          const npmVer = npmVerPattern.exec(parameters.polenVer)?.[1]
          if (!npmVer) {
            throw new Error(`Invalid polenVer: ${parameters.polenVer}`)
          }
          await exampleShell`pnpm add ${parameters.polenVer}`
          debug(`install polen as npm dependency`)
          break
        }
      }
    }

    await exampleShell`pnpm install`
    debug(`installed dependencies`)

    const config = await import(`${exampleFs.cwd()}/vite.config.js`) as {
      default: ViteUserConfigWithPolen,
    }
    debug(`loaded configuration`)

    const packageJson = await exampleFs.readAsync(`package.json`, `json`) as PackageJson

    return {
      name: parameters.exampleName,
      shell: exampleShell,
      fs: exampleFs,
      config: config.default,
      packageJson,
    }
  }
}
