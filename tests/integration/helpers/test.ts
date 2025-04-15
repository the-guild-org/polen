import { test as base } from 'playwright/test'
import { ViteController } from './vite-controller/_namespace.js'

interface Fixtures {
  viteController: ViteController.ViteController
}

export const test = base.extend<Fixtures>({
  viteController: async ({}, use) => {
    const controller = ViteController.create()
    await use(controller)
    await controller.stopDevelopmentServer()
  },
})
