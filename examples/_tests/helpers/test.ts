import { test as base } from 'playwright/test'
import type { ServerProcess } from './run.js'
import { runBuild, runDev, runStart } from './run.js'
import type { ProcessOutput } from 'zx'

interface Fixtures {
  cwd: string
  runDev: ServerProcess
  runBuild: ProcessOutput
  runStart: ServerProcess
}

export const test = base.extend<Fixtures>({
  cwd: [process.cwd(), { option: true }],
  runDev: async ({ cwd }, use) => {
    const server = await runDev({ cwd })
    // eslint-disable-next-line
    await use(server)
    await server.process.kill()
  },
  runBuild: async ({ cwd }, use) => {
    const output = await runBuild({ cwd })
    // eslint-disable-next-line
    await use(output)
  },
  runStart: async ({ cwd, runBuild: _ }, use) => {
    const server = await runStart({ cwd })
    // eslint-disable-next-line
    await use(server)
    await server.process.kill(`SIGKILL`)
  },
})
