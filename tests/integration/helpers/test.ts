import { Path, ProjectController } from '@wollybeard/kit'
import { test as base } from 'playwright/test'
import { ViteController } from './vite-controller/index.js'

interface Fixtures {
  vite: ViteController.ViteController
  project: ProjectController.ProjectController
}

const projectDir = Path.join(import.meta.dirname, `../../../`)

export const test = base.extend<Fixtures>({
  project: async ({}, use) => {
    const project = await ProjectController.create({
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
  vite: async ({}, use) => {
    const viteController = ViteController.create()
    await use(viteController)
    await viteController.stopDevelopmentServer()
  },
})
