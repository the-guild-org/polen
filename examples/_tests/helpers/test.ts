import { test as base } from 'playwright/test'
import type { ServerProcess } from './run.js'
import { runBuild, runDev, runStart } from './run.js'
import { $, type ProcessOutput } from 'zx'
import type { Configurator } from '../../../src/configurator/_namespace.js'
import type { ViteUserConfigWithPolen } from '../../../src/createConfiguration.js'

const PolenSource = {
  localLink: `localLink`,
  localFile: `localFile`,
  registry: `registry`,
} as const

export type PolenSource = (typeof PolenSource)[keyof typeof PolenSource]

export interface Fixtures {
  cwd: string
  /**
   * Should Polen be installed from the local source or from the registry?
   *
   * If `local-*`, the local Polen source will be used. You are responsible for
   * having local Polen be built (e.g. You previously ran `pnpm build`). The two kinds of
   * local correspond to pnpm `link` and `file` respectively (see https://pnpm.io/cli/link#whats-the-difference-between-pnpm-link-and-using-the-file-protocol).
   *
   * @defaultValue 'registry'
   */
  polenSource: PolenSource
  runDev: ServerProcess
  installDependencies: ProcessOutput
  runBuild: ProcessOutput
  runStart: ServerProcess
  polenConfig: Configurator.Config
}

export const test = base.extend<Fixtures>({
  polenSource: [`registry`, { option: true }],
  cwd: [process.cwd(), { option: true }],
  polenConfig: async ({ cwd }, use) => {
    const config = await import(`${cwd}/vite.config.js`) as { default: ViteUserConfigWithPolen }
    // eslint-disable-next-line
    await use(config.default._polen.normalized)
  },
  installDependencies: async ({ cwd, polenSource }, use) => {
    const output = await $({ cwd })`pnpm install`
    if (polenSource !== PolenSource.registry) {
      const protocol = polenSource === PolenSource.localLink ? `link` : `file`
      if (protocol === `link`) {
        await $({ cwd })`pnpm link ../..`
      } else {
        await $({ cwd })`pnpm add polen@${protocol}:../..`
      }
    }
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
