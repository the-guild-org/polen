import { test as base } from 'playwright/test'
import { type ProcessOutput } from 'zx'
import type { Ver } from './ver.js'
import type { ExampleName } from './example-name.js'
import { ExampleController } from './example-controller/_namespace.js'

export interface TestFixtures {
  runDev: ExampleController.ServerProcess
  runBuild: ProcessOutput
  runStart: ExampleController.ServerProcess
}

export interface WorkerFixtures {
  exampleName: ExampleName
  polenVer: Ver | undefined
  project: ExampleController.ExampleController
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  polenVer: [undefined, { option: true, scope: `worker` }],
  exampleName: [`basic`, { option: true, scope: `worker` }],
  project: [async ({ exampleName, polenVer }, use) => {
    const project = await ExampleController.create({
      exampleName,
      polenVer,
      debug: true,
    })
    await use(project)
  }, { scope: `worker` }],
  runDev: async ({ project }, use) => {
    const server = await project.run.dev()
    await use(server)
    await server.stop()
  },
  runBuild: async ({ project }, use) => {
    const output = await project.run.build()
    await use(output)
  },
  runStart: async ({ project, runBuild: _ }, use) => {
    const server = await project.run.start()
    await use(server)
    await server.stop()
  },
})
