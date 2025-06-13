import { Api } from '#api/index'
import { debugGlobal } from '#lib/debug/debug'
import type { PackageManager } from '@wollybeard/kit'
import { Path } from '@wollybeard/kit'
import { Projector } from '@wollybeard/projector'
import { stripAnsi } from 'consola/utils'
import * as GetPortPlease from 'get-port-please'
import type { ProcessPromise } from 'zx'
import type { ExampleName } from '../example-name.js'

const projectDir = Path.join(import.meta.dirname, `../../../../`)
const examplesDir = Path.join(projectDir, `/examples`)

export type ExampleController = Awaited<ReturnType<typeof create>>

/**
 * Create a temporary directory with the contents of the chosen example.
 */
export const create = async (parameters: {
  exampleName: ExampleName
  debugMode?: boolean
  polenLink?: PackageManager.LinkProtocol
  portProductionServer?: number
}) => {
  const debug = debugGlobal.sub(parameters.exampleName)
  debug.toggle(parameters.debugMode ?? false)

  const project = await Projector.create({
    debug,
    package: {
      install: true,
      links: parameters.polenLink && [
        {
          dir: projectDir,
          protocol: parameters.polenLink,
        },
      ],
    },
    scaffold: Path.join(examplesDir, parameters.exampleName),

    scripts: project => ({
      build: async () => {
        return await project.packageManager`run build --architecture ssr`
      },
      buildSsg: async () => {
        return await project.packageManager`run build --architecture ssg`
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
      serveSsg: async () => {
        const port = await GetPortPlease.getRandomPort()
        const url = `http://localhost:${port.toString()}`

        // Use a simple static file server to serve the SSG build
        // The build output is in the 'build' directory, not 'dist'
        const serverProcess = project.shell({
          env: { ...process.env },
        })`npx serve build --listen ${port.toString()} --single`

        // Give the server time to start
        await project.shell`sleep 2`

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

        // Create a promise that resolves when we find the URL
        const serverReady = new Promise<ServerProcess>((resolve, reject) => {
          const processIterator = serverProcess[Symbol.asyncIterator]()

          const readLines = async () => {
            try {
              for await (const line of { [Symbol.asyncIterator]: () => processIterator }) {
                const linePlain = stripAnsi(line)
                const url = (logUrlPattern.exec(linePlain))?.[1]
                if (url) {
                  resolve({
                    raw: serverProcess,
                    stop: async () => {
                      await stopServerProcess(serverProcess)
                    },
                    url,
                  })
                  // Don't break - let the process continue running
                  return
                }
              }
              reject(new Error(`Server process did not output a URL`))
            } catch (error) {
              // Ignore errors after we found the URL
              // eslint-disable-next-line
              if (!serverReady) {
                // eslint-disable-next-line
                reject(error)
              }
            }
          }

          // eslint-disable-next-line
          readLines()
        })

        return await serverReady
      },
    }),
  })

  const config = await Api.ConfigResolver.fromFile({ dir: project.layout.cwd })
  debug(`loaded configuration`)

  return {
    ...project,
    name: parameters.exampleName,
    config,
  }
}

export interface ServerProcess {
  raw: ProcessPromise
  stop: () => Promise<void>
  url: string
}

export const stopServerProcess = async (processPromise: ProcessPromise) => {
  processPromise.catch((___error: unknown) => {
    // We cannot achieve a clean exit for some reason so far.
    // console.log(`server process error on kill -----------------`)
    // console.log(error)
    // console.log(`server process error on kill -----------------`)
    // silence
    // throw error
  })
  await processPromise.kill()
}

export const polenDev = async (project: ExampleController) => {
  const serverProcess = project.packageManager`polen dev`

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
}
