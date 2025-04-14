import { test as base } from 'playwright/test'
import type { ServerProcess } from './run.js'
import { runBuild, runDev, runStart } from './run.js'
import { type ProcessOutput } from 'zx'
import type { Ver } from './ver.js'
import { ExampleController } from './example-controller.js'
import type { ExampleName } from './example-name.js'

export interface TestFixtures {
  runDev: ServerProcess
  runBuild: ProcessOutput
  runStart: ServerProcess
}

export interface WorkerFixtures {
  exampleName: ExampleName
  polenVer: Ver | undefined
  project: ExampleController.ExampleController
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  polenVer: [undefined, { option: true, scope: `worker` }],
  exampleName: [`basic`, { option: true, scope: `worker` }],
  project: [async ({ exampleName, polenVer }, use, workerInfo) => {
    console.log(`run fixture project`, workerInfo.workerIndex, exampleName, polenVer)
    const project = await ExampleController.create({
      exampleName,
      polenVer,
      debug: true,
    })
    await use(project)
  }, { scope: `worker` }],
  runDev: async ({ project }, use) => {
    const server = await runDev({ cwd: project.fs.cwd() })
    // eslint-disable-next-line
    await use(server)
    await server.process.kill()
  },
  runBuild: async ({ project }, use) => {
    const output = await runBuild({ cwd: project.fs.cwd() })
    // eslint-disable-next-line
    await use(output)
  },
  runStart: async ({ project }, use) => {
    const server = await runStart({ cwd: project.fs.cwd() })
    // eslint-disable-next-line
    await use(server)
    await server.process.kill()
  },
})
