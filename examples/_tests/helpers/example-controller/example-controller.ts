import type { PackageJson } from 'type-fest'
import Fsj from 'fs-jetpack'
import { Path } from '../../../../src/lib/path/_namespace.js'
import { Url } from '../../../../src/lib/url/_namespace.js'
import type { ProcessOutput, ProcessPromise, Shell } from 'zx'
import { $ } from 'zx'
import type { FSJetpack } from 'fs-jetpack/types.js'
import type { ExampleName } from '../example-name.js'
import { debug as debugBase } from '../../../../src/lib/debug/debug.js'
import { type Ver, npmVerPattern } from '../ver.js'
import type { ViteUserConfigWithPolen } from '../../../../src/createConfiguration.js'
import * as GetPortPlease from 'get-port-please'
import { stripAnsi } from 'consola/utils'

const selfPath = Url.fileURLToPath(import.meta.url)
const selfDir = Path.dirname(selfPath)
const projectDir = Path.join(selfDir, `../../../../`)
const examplesDir = Path.join(projectDir, `/examples`)
console.log({
  selfPath,
  selfDir,
  projectDir,
  examplesDir,
})

export interface ExampleController {
  name: ExampleName
  shell: Shell
  fs: FSJetpack
  config: ViteUserConfigWithPolen
  packageJson: PackageJson
  run: {
    build: () => Promise<ProcessOutput>,
    dev: () => Promise<ServerProcess>,
    start: () => Promise<ServerProcess>,
  }
}

/**
 * Create a temporary directory with teh contents of the chosen example.
 */
export const create = async (parameters: {
  exampleName: ExampleName,
  debugMode?: boolean,
  polenVer?: Ver,
  portProductionServer?: number,
}) => {
  const debug = debugBase.sub(parameters.exampleName)

  debug.toggle(parameters.debugMode ?? false)

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

  const run = {
    build: async () => {
      return await exampleShell`pnpm run build`
    },
    start: async () => {
      const port = await GetPortPlease.getRandomPort()

      const url = `http://localhost:${port.toString()}`

      const serverProcess = exampleShell`PORT=${port} pnpm run start`

      // todo: If we give some log output from server then we can use that to detect when the server is ready.
      await exampleShell`sleep 1`

      return {
        raw: serverProcess,
        stop: async () => {
          await stopServerProcess(serverProcess)
        },
        url,
      }
    },
    dev: async () => {
      const serverProcess = exampleShell`pnpm run dev`

      const logUrlPattern = /(https?:\/\/\S+)/
      for await (const line of serverProcess) {
        const linePlain = stripAnsi(line)
        const url = (logUrlPattern.exec(linePlain))?.[1]
        if (url) {
          return {
            raw: serverProcess,
            stop: async () => {
              await stopServerProcess(serverProcess)
            },
            url,
          }
        }
      }

      throw new Error(`Server process did not output a URL`)
    },
  }

  return {
    name: parameters.exampleName,
    shell: exampleShell,
    fs: exampleFs,
    config: config.default,
    packageJson,
    run,
  }
}

export interface ServerProcess {
  raw: ProcessPromise
  stop: () => Promise<void>
  url: string
}

export const stopServerProcess = async (processPromise: ProcessPromise) => {
  processPromise.catch((_error: unknown) => {
    // We cannot achieve a clean exit for some reason so far.
    // console.log(`server process error on kill -----------------`)
    // console.log(error)
    // console.log(`server process error on kill -----------------`)
    // silence
    // throw error
  })
  await processPromise.kill()
}
