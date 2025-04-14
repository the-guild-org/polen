import type { PackageJson } from 'type-fest'
import Fsj from 'fs-jetpack'
import { Path } from '../../../src/lib/path/_namespace.js'
import { Url } from '../../../src/lib/url/_namespace.js'
import type { Shell } from 'zx'
import { $ } from 'zx'
import type { FSJetpack } from 'fs-jetpack/types.js'
import type { ExampleName } from './example-name.js'
import { debug } from '../../../src/lib/debug/debug.js'
import type { PolenSource } from './polen-source.js'
import { PolenSourceEnum } from './polen-source.js'
import { casesHandled } from '../../../src/lib/prelude/main.js'
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
    polenSource?: PolenSource,
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

    if (parameters.polenSource && parameters.polenSource !== PolenSourceEnum.registry) {
      switch (parameters.polenSource) {
        case PolenSourceEnum.localLink: {
          await exampleShell`pnpm add ${`link:` + pathToPolenSourceCodeFromExample}`
          debug(`install polen as link dependency`)
          break
        }
        case PolenSourceEnum.localFile: {
          await exampleShell`pnpm add ${`file:` + pathToPolenSourceCodeFromExample}`
          debug(`install polen as file dependency`)
          break
        }
        default: {
          casesHandled(parameters.polenSource)
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
