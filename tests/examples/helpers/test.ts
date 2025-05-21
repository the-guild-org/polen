import type { PackageManager } from '@wollybeard/kit'
import { test as base } from 'playwright/test'
import { type ProcessOutput } from 'zx'
import { ExampleController } from './example-controller/index.js'
import type { ExampleName } from './example-name.js'

export interface TestFixtures {
  runDev: ExampleController.ServerProcess
  runBuild: ProcessOutput
  runStart: ExampleController.ServerProcess
}

export interface WorkerFixtures {
  exampleName: ExampleName
  polenLink: PackageManager.LinkProtocol | undefined
  project: ExampleController.ExampleController
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  polenLink: [undefined, { option: true, scope: `worker` }],
  exampleName: [`pokemon`, { option: true, scope: `worker` }],
  project: [async ({ exampleName, polenLink }, use) => {
    const project = await ExampleController.create({
      exampleName,
      polenLink,
      debugMode: true,
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
  runStart: async ({ project, runBuild: ___ }, use) => {
    const server = await project.run.start()
    await use(server)
    await server.stop()
  },
})
