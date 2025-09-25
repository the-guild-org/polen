import { Api } from '#api/$'
import { Ef } from '#dep/effect'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import type { PackageManager } from '@wollybeard/kit'
import { Debug, FsLoc } from '@wollybeard/kit'
import { Projector } from '@wollybeard/projector'
import { stripAnsi } from 'consola/utils'
import * as GetPortPlease from 'get-port-please'
import { $ } from 'zx'
import type { ProcessPromise } from 'zx'
import { ExampleName } from '../example-name.js'

const projectDir = FsLoc.join(
  FsLoc.decodeSync(import.meta.dirname) as FsLoc.AbsDir,
  FsLoc.decodeSync(`../../../../`) as FsLoc.RelDir,
)
const examplesDir = FsLoc.join(projectDir, FsLoc.decodeSync(`examples/`) as FsLoc.RelDir)

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
      scaffold: FsLoc.encodeSync(
        FsLoc.join(examplesDir, FsLoc.decodeSync(parameters.exampleName + '/') as FsLoc.RelDir),
      ),

      scripts: project => ({
        build: () =>
          Ef.gen(function*() {
            const result = yield* project.packageManager('run build --architecture ssr')
            return result as any // Return as ProcessOutput compatible type
          }).pipe(Ef.orDie),
        buildSsg: () =>
          Ef.gen(function*() {
            const result = yield* project.packageManager('run build --architecture ssg')
            return result as any // Return as ProcessOutput compatible type
          }).pipe(Ef.orDie),
        start: () =>
          Ef.gen(function*() {
            const port = yield* Ef.tryPromise(() => GetPortPlease.getRandomPort())
            const url = `http://localhost:${port.toString()}`
            const projectPath = FsLoc.encodeSync(project.dir.base)

            // Use zx directly for process management
            $.env = { ...process.env, PORT: port.toString() }
            const serverProcess = $`cd ${projectPath} && pnpm run start`.pipe(
              process.stdout,
            )

            // Wait for server to be ready
            yield* Ef.tryPromise(() => new Promise(resolve => setTimeout(resolve, 1000)))

            return {
              raw: serverProcess,
              stop: async () => {
                await stopServerProcess(serverProcess)
              },
              url,
            }
          }),
        serveSsg: () =>
          Ef.gen(function*() {
            const port = yield* Ef.tryPromise(() => GetPortPlease.getRandomPort())
            const url = `http://localhost:${port.toString()}`
            const projectPath = FsLoc.encodeSync(project.dir.base)

            // Use zx for the static server
            const serverProcess =
              $`cd ${projectPath} && npx serve build --listen ${port.toString()} --single --no-clipboard`.pipe(
                process.stdout,
              )

            // Wait for server to be ready
            const maxRetries = 30
            for (let retries = 0; retries < maxRetries; retries++) {
              try {
                yield* Ef.tryPromise(() => fetch(url))
                break
              } catch {
                if (retries === maxRetries - 1) {
                  throw new Error(`SSG server failed to start on ${url} after ${maxRetries} attempts`)
                }
                yield* Ef.tryPromise(() => new Promise(resolve => setTimeout(resolve, 500)))
              }
            }

            return {
              raw: serverProcess,
              stop: async () => {
                await stopServerProcess(serverProcess)
              },
              url,
            }
          }),
        dev: () =>
          Ef.gen(function*() {
            const projectPath = FsLoc.encodeSync(project.dir.base)
            const serverProcess = $`cd ${projectPath} && pnpm run dev`.pipe(
              process.stdout,
            )

            const logUrlPattern = /(https?:\/\/\S+)/

            // Wait for server to output URL
            const serverReady = yield* Ef.tryPromise(() =>
              new Promise<ServerProcess>((resolve, reject) => {
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
                      }
                    }

                    if (!urlFound) {
                      const errorDetails = serverErrors.length > 0
                        ? `\nServer errors:\n${serverErrors.join(`\n`)}`
                        : ``
                      reject(new Error(`Server process did not output a URL${errorDetails}`))
                    }
                  } catch (error) {
                    if (!urlFound) {
                      reject(error)
                    }
                  }
                }

                readLines()
              })
            )

            return serverReady
          }),
      }),
    })

    const config = yield* Api.ConfigResolver.fromFile({ dir: project.dir.base }).pipe(
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
  const projectPath = FsLoc.encodeSync(project.dir.base)
  const serverProcess = $`cd ${projectPath} && pnpm polen dev`.pipe(
    process.stdout,
  )

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
