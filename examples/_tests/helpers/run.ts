import { stripAnsi } from 'consola/utils'
import type { ProcessOutput, ProcessPromise } from 'zx'
import { $ } from 'zx'

export const runBuild = async (
  { cwd }: { cwd: string },
): Promise<ProcessOutput> => {
  const $$ = $({ cwd })
  const output = await $$`pnpm run build`
  return output
}

export interface ServerProcess {
  raw: ProcessPromise
  stop: () => Promise<void>
  url: string
}

export const runDev = async (
  { cwd }: { cwd: string },
): Promise<ServerProcess> => {
  const $$ = $({ cwd })

  const serverProcess = $$`pnpm run dev`

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

export const runStart = async ({ cwd }: { cwd: string }): Promise<ServerProcess> => {
  const $$ = $({ cwd })

  const serverProcess = $$`pnpm run start`

  // todo: If we give some log output from server then we can use that to detect when the server is ready.
  await $$`sleep 1`

  return {
    raw: serverProcess,
    stop: async () => {
      await stopServerProcess(serverProcess)
    },
    url: `http://localhost:5174`,
  }
}

const stopServerProcess = async (processPromise: ProcessPromise) => {
  processPromise.catch((error: unknown) => {
    // We cannot achieve a clean exit for some reason so far.
    // console.log(`server process error on kill -----------------`)
    // console.log(error)
    // console.log(`server process error on kill -----------------`)
    // silence
    // throw error
  })
  await processPromise.kill()
}
