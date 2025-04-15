import { stripAnsi } from 'consola/utils'
import { $ } from 'zx'
import type { ServerProcess } from './example-controller.js'
import { stopServerProcess } from './example-controller.js'

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

// export const runStart = async ({ cwd }: { cwd: string }): Promise<ServerProcess> => {
//   const $$ = $({ cwd })

//   const serverProcess = $$`pnpm run start`

//   // todo: If we give some log output from server then we can use that to detect when the server is ready.
//   await $$`sleep 1`

//   return {
//     raw: serverProcess,
//     stop: async () => {
//       await stopServerProcess(serverProcess)
//     },
//     url: `http://localhost:5174`,
//   }
// }
