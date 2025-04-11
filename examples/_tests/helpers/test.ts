import { test as base } from 'playwright/test'
import type { ServerProcess } from './run.js'
import { runBuild, runDev, runStart } from './run.js'
import { $, type ProcessOutput } from 'zx'
import type { Configurator } from '../../../src/configurator/_namespace.js'
import type { ViteUserConfigWithPolen } from '../../../src/createConfiguration.js'

export interface Fixtures {
  cwd: string
  runDev: ServerProcess
  installDependencies: ProcessOutput
  runBuild: ProcessOutput
  runStart: ServerProcess
  polenConfig: Configurator.Config
}

export const test = base.extend<Fixtures>({
  cwd: [process.cwd(), { option: true }],
  polenConfig: async ({ cwd }, use) => {
    const config = await import(`${cwd}/vite.config.js`) as { default: ViteUserConfigWithPolen }
    // eslint-disable-next-line
    await use(config.default._polen.normalized)
  },
  installDependencies: async ({ cwd }, use) => {
    const output = await $({ cwd })`pnpm install`
    // eslint-disable-next-line
    await use(output)
  },
  runDev: async ({ installDependencies: _, cwd }, use) => {
    const server = await runDev({ cwd })
    // eslint-disable-next-line
    await use(server)
    await server.process.kill()
  },
  runBuild: async ({ installDependencies: _, cwd }, use) => {
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
