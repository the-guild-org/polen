import { test as base } from 'playwright/test'
import { type ProcessOutput } from 'zx'
import type { ExampleName } from './example-name.js'
import { ExampleController } from './example-controller/index.js'
import { PackageManager } from '@wollybeard/kit'

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
  runStart: async ({ project, runBuild: _ }, use) => {
    const server = await project.run.start()
    await use(server)
    await server.stop()
  },
})
