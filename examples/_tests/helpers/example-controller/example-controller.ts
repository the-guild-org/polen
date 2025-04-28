import { Path } from '../../../../src/lib-dep/path/index.js'
import { Url } from '../../../../src/lib-dep/url/index.js'
import type { ProcessPromise } from 'zx'
import type { ExampleName } from '../example-name.js'
import { debug as debugBase } from '../../../../src/lib/debug/debug.js'
import type { ViteUserConfigWithPolen } from '../../../../src/create-configuration.js'
import * as GetPortPlease from 'get-port-please'
import { stripAnsi } from 'consola/utils'
import { ProjectController } from '../../../../src/lib/project-controller/index.js'
import type { LinkProtocol } from '../../../../src/lib/link-protocol.js'

const selfPath = Url.fileURLToPath(import.meta.url)
const selfDir = Path.dirname(selfPath)
const projectDir = Path.join(selfDir, `../../../../`)
const examplesDir = Path.join(projectDir, `/examples`)

export type ExampleController = Awaited<ReturnType<typeof create>>

/**
 * Create a temporary directory with the contents of the chosen example.
 */
export const create = async (parameters: {
  exampleName: ExampleName,
  debugMode?: boolean,
  polenLink?: LinkProtocol,
  portProductionServer?: number,
}) => {
  const debug = debugBase.sub(parameters.exampleName)
  debug.toggle(parameters.debugMode ?? false)

  const project = await ProjectController.create({
    debug,
    install: true,
    scaffold: Path.join(examplesDir, parameters.exampleName),
    links: parameters.polenLink && [
      {
        dir: projectDir,
        protocol: parameters.polenLink,
      },
    ],
    scripts: project => ({
      build: async () => {
        return await project.packageManager`run build`
      },
      start: async () => {
        const port = await GetPortPlease.getRandomPort()

        const url = `http://localhost:${port.toString()}`

        const serverProcess = project.packageManager({
          env: { ...process.env, PORT: port.toString() },
        })`run start`

        // todo: If we give some log output from server then we can use that to detect when the server is ready.
        await project.shell`sleep 1`

        return {
          raw: serverProcess,
          stop: async () => {
            await stopServerProcess(serverProcess)
          },
          url,
        }
      },
      dev: async () => {
        const serverProcess = project.packageManager`run dev`

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
    }),
  })

  const config = await import(`${project.fileStorage.cwd}/vite.config.js`) as {
    default: ViteUserConfigWithPolen,
  }
  debug(`loaded configuration`)

  return {
    ...project,
    name: parameters.exampleName,
    config: config.default,
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
