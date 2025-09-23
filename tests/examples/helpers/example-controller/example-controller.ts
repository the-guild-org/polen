import { Api } from '#api/$'
import { Ef } from '#dep/effect'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import type { PackageManager } from '@wollybeard/kit'
import { Debug, FsLoc } from '@wollybeard/kit'
import { Projector } from '@wollybeard/projector'
import { stripAnsi } from 'consola/utils'
import * as GetPortPlease from 'get-port-please'
import type { ProcessPromise } from 'zx'
import { ExampleName } from '../example-name.js'

const projectDir = FsLoc.join(
  FsLoc.fromString(import.meta.dirname),
  FsLoc.fromString(`../../../../`),
)
const examplesDir = FsLoc.join(projectDir, FsLoc.fromString(`examples/`))

export type ExampleController = Ef.Effect.Success<ReturnType<typeof create>>

/**
 * Create a temporary directory with the contents of the chosen example.
 */
export const create = (parameters: {
  exampleName: ExampleName.ExampleName
  debugMode?: boolean | undefined
  polenLink?: PackageManager.LinkProtocol | undefined
  portProductionServer?: number
}) =>
  Ef.gen(function*() {
    const debug = Debug.create(parameters.exampleName)
    debug.toggle(parameters.debugMode ?? false)

    const project = yield* Projector.create({
      debug,
      package: {
        install: true,
        links: [
          {
            dir: FsLoc.encodeSync(projectDir),
            protocol: parameters.polenLink ?? 'file',
          },
        ],
      },
      scaffold: FsLoc.encodeSync(FsLoc.join(examplesDir, parameters.exampleName + '/')),

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
          })`npx serve build --listen ${port.toString()} --single --no-clipboard`

          // Wait for server to be ready by checking if it's responding
          const maxRetries = 30
          let retries = 0
          while (retries < maxRetries) {
            try {
              await fetch(url)
              break
            } catch (error) {
              retries++
              if (retries === maxRetries) {
                throw new Error(`SSG server failed to start on ${url} after ${maxRetries} attempts`)
              }
              await project.shell`sleep 0.5`
            }
          }

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

            let urlFound = false
            const serverErrors: string[] = []
            const readLines = async () => {
              try {
                for await (const line of { [Symbol.asyncIterator]: () => processIterator }) {
                  console.log(line)

                  const linePlain = stripAnsi(line)

                  const isError = line.toLowerCase().includes(`error`) || line.includes(`Error`)

                  if (isError) {
                    serverErrors.push(line)
                    // If we haven't found URL yet and hit an error, reject immediately
                    if (!urlFound) {
                      reject(new Error(`Server failed to start: ${line}`))
                      return
                    }
                  }

                  const url = (logUrlPattern.exec(linePlain))?.[1]
                  if (url && !urlFound) {
                    urlFound = true
                    resolve({
                      raw: serverProcess,
                      stop: async () => {
                        await stopServerProcess(serverProcess)
                      },
                      url,
                    })
                    // Continue consuming output to prevent EPIPE
                    // Don't return here - keep the iterator alive
                  }
                }
                if (!urlFound) {
                  const errorDetails = serverErrors.length > 0
                    ? `\nServer errors:\n${serverErrors.join(`\n`)}`
                    : ``
                  reject(new Error(`Server process did not output a URL${errorDetails}`))
                }
              } catch (error) {
                // Log any errors that occur

                if (!urlFound) {
                  reject(error)
                }
              }
            }

            readLines()
          })

          return await serverReady
        },
      }),
    })

    const config = yield* Api.ConfigResolver.fromFile({ dir: project.dir }).pipe(
      Ef.provide(NodeFileSystem.layer),
    )
    debug(`loaded configuration`)

    return {
      ...project,
      name: parameters.exampleName,
      config,
    }
  })

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
