import { test as base } from 'playwright/test'
import { ViteController } from './vite-controller/_namespace.js'
import { ProjectController } from '../../../src/lib/project-controller/_namespace.js'

interface Fixtures {
  viteController: ViteController.ViteController
  project: ProjectController.ProjectController
}

export const test = base.extend<Fixtures>({
  project: async ({}, use) => {
    const controller = await ProjectController.create({})
    await use(controller)
  },
  viteController: async ({}, use) => {
    const controller = ViteController.create()
    await use(controller)
    await controller.stopDevelopmentServer()
  },
})
