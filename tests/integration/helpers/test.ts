import { Ef } from '#dep/effect'
import { NodeFileSystem } from '@effect/platform-node'
import { FsLoc } from '@wollybeard/kit'
import { Projector } from '@wollybeard/projector'
import { Context, Layer } from 'effect'
import * as Path from 'node:path'
import { test as base } from 'playwright/test'
import { polen as createPolenBuilder } from './polen-builder.js'
import { ViteController } from './vite-controller/index.js'

const projectDir = Path.join(import.meta.dirname, `../../../`)

// Create service tags for internal Effect usage
class ProjectorService extends Context.Tag('IntegrationProjector')<
  ProjectorService,
  Projector.Projector
>() {}

class ViteService extends Context.Tag('ViteService')<
  ViteService,
  ViteController.ViteController
>() {}

class PolenService extends Context.Tag('PolenService')<
  PolenService,
  ReturnType<typeof createPolenBuilder>
>() {}

// Define Playwright test fixtures
export interface TestFixtures {
  vite: ViteController.ViteController
  polen: ReturnType<typeof createPolenBuilder>
}

export interface WorkerFixtures {
  project: Projector.Projector
}

// Create Playwright test with fixtures
export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker-scoped fixture for project
  project: [async ({}, use) => {
    // Create projector using Effect
    const program = Projector.create({
      package: {
        install: true,
        links: [
          {
            dir: projectDir,
            protocol: `link`,
          },
        ],
      },
    })

    const project = await Ef.runPromise(
      program.pipe(Ef.provide(NodeFileSystem.layer)),
    )
    await use(project)

    // Cleanup is not needed since Projector is not scoped anymore
  }, { scope: 'worker' }],

  // Test-scoped fixture for vite
  vite: [async ({ project }, use) => {
    const viteController = ViteController.create({
      cwd: project.dir.base,
      defaultConfigInput: {
        advanced: {
          paths: {
            devAssets: FsLoc.encodeSync(project.dir.base) + '/.polen/dev/assets',
          },
        },
      },
    })

    await use(viteController)

    // Verify no errors and cleanup
    for (const store of viteController.devLoggerStores) {
      if (store.errors.length > 0) {
        console.error('Vite errors:', store.errors)
      }
    }
    await viteController.stopDevelopmentServer()
  }, { scope: 'test' }],

  // Test-scoped fixture for polen
  polen: [async ({ page, vite, project }, use) => {
    const polenBuilder = createPolenBuilder(page, vite, project.dir.base)
    await use(polenBuilder)
  }, { scope: 'test' }],
})

// Export expect from playwright
export { expect } from 'playwright/test'

// Export service tags for tests that want to use Effect directly
export const ProjectorTag = ProjectorService
export const ViteTag = ViteService
export const PolenTag = PolenService

// Create layers for tests that want to use Effect
export const ProjectorLive = Layer.effect(
  ProjectorService,
  Projector.create({
    package: {
      install: true,
      links: [
        {
          dir: projectDir,
          protocol: `link`,
        },
      ],
    },
  }),
).pipe(Layer.provide(NodeFileSystem.layer))

export const ViteLive = Layer.scoped(
  ViteService,
  Ef.gen(function*() {
    const project = yield* ProjectorService
    const viteController = ViteController.create({
      cwd: project.dir.base,
      defaultConfigInput: {
        advanced: {
          paths: {
            devAssets: FsLoc.encodeSync(project.dir.base) + '/.polen/dev/assets',
          },
        },
      },
    })

    yield* Ef.addFinalizer(() =>
      Ef.gen(function*() {
        for (const store of viteController.devLoggerStores) {
          if (store.errors.length > 0) {
            console.error('Vite errors:', store.errors)
          }
        }
        yield* Ef.promise(() => viteController.stopDevelopmentServer())
      })
    )

    return viteController
  }),
).pipe(Layer.provide(ProjectorLive))

// Export layers for Effect-based tests
export const IntegrationLive = Layer.merge(ProjectorLive, ViteLive)
