import { test as base } from 'playwright/test'
import { ViteController } from './vite-controller/index.js'
import { ProjectController } from '@wollybeard/kit'

interface Fixtures {
  vite: ViteController.ViteController
  project: ProjectController.ProjectController
}

export const test = base.extend<Fixtures>({
  project: async ({}, use) => {
    const project = await ProjectController.create({})
    await use(project)
  },
  vite: async ({}, use) => {
    const viteController = ViteController.create()
    await use(viteController)
    await viteController.stopDevelopmentServer()
  },
})
