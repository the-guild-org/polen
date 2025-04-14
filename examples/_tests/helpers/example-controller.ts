import Fsj from 'fs-jetpack'
import { Path } from '../../../src/lib/path/_namespace.js'
import { Url } from '../../../src/lib/url/_namespace.js'
import type { Shell } from 'zx'
import { $ } from 'zx'
import type { FSJetpack } from 'fs-jetpack/types.js'
import type { ExampleName } from './example-name.js'
import { debug } from '../../../src/lib/debug/debug.js'
import { PolenSource } from './polen-source.js'
import { casesHandled } from '../../../src/lib/prelude/main.js'
import type { ViteUserConfigWithPolen } from '../../../src/createConfiguration.js'

const selfPath = Url.fileURLToPath(import.meta.url)
const examplesDir = Path.join(Path.dirname(selfPath), `../../`)

export namespace ExampleController {
  export interface ExampleController {
    name: ExampleName
    shell: Shell
    fs: FSJetpack
    config: ViteUserConfigWithPolen
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

    if (parameters.polenSource) {
      switch (parameters.polenSource) {
        case PolenSource.registry: {
          // nothing to do
          break
        }
        case PolenSource.localFile: {
          await exampleShell`pnpm link ../..`
          debug(`linked Polen using file protocol`)
          break
        }
        case PolenSource.localLink: {
          await exampleShell`pnpm link file:../..`
          debug(`linked Polen using file protocol`)
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

    return {
      name: parameters.exampleName,
      shell: exampleShell,
      fs: exampleFs,
      config: config.default,
    }
  }
}
