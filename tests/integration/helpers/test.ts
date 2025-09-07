import { Path } from '@wollybeard/kit'
import { Projector } from '@wollybeard/projector'
import { expect, test as base } from 'playwright/test'
import { polen as createPolenBuilder } from './polen-builder.js'
import { ViteController } from './vite-controller/index.js'

interface Fixtures {
  vite: ViteController.ViteController
  project: Projector.Projector
  polen: ReturnType<typeof createPolenBuilder>
}

const projectDir = Path.join(import.meta.dirname, `../../../`)

export const test = base.extend<Fixtures>({
  project: async ({}, use) => {
    const project = await Projector.create({
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
    await use(project)
  },
  vite: async ({ project }, use) => {
    const viteController = ViteController.create({
      cwd: project.layout.cwd,
      defaultConfigInput: {
        advanced: {
          paths: {
            devAssets: project.layout.cwd + '/.polen/dev/assets',
          },
        },
      },
    })
    await use(viteController)
    for (const store of viteController.devLoggerStores) {
      expect(store.errors).toEqual([])
    }
    await viteController.stopDevelopmentServer()
  },
  polen: async ({ page, vite, project }, use) => {
    const polenBuilder = createPolenBuilder(page, vite, project.layout.cwd)
    await use(polenBuilder)
  },
})
