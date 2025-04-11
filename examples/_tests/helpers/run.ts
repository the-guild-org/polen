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
  process: ProcessPromise
  url: string
}

export const runDev = async (
  { cwd }: { cwd: string },
): Promise<ServerProcess> => {
  const $$ = $({ cwd })

  const serverProcess = $$`pnpm run dev`
  serverProcess.catch(console.error)

  const logUrlPattern = /(https?:\/\/\S+)/
  for await (const line of serverProcess) {
    const linePlain = stripAnsi(line)
    const url = (logUrlPattern.exec(linePlain))?.[1]
    if (url) {
      return {
        process: serverProcess,
        url,
      }
    }
  }

  throw new Error(`Server process did not output a URL`)
}

export const runStart = async ({ cwd }: { cwd: string }): Promise<ServerProcess> => {
  const $$ = $({ cwd })

  const serverProcess = $$`pnpm run start`

  // eslint-disable-next-line
  serverProcess.catch((error: ProcessOutput) => {
    // We cannot achieve a clean exit for some reason so far.
    console.log(`runStart server process error -----------------`)
    console.log(error)
    console.log(`runStart server process error -----------------`)
    // silence
    // throw error
  })

  // todo: If we give some log output from server then we can use that to detect when the server is ready.
  await $$`sleep 1`

  return {
    process: serverProcess,
    url: `http://localhost:5174`,
  }
}
