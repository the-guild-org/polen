import { Path } from '@wollybeard/kit'
import { Projector } from '@wollybeard/projector'
import { test as base } from 'playwright/test'
import { ViteController } from './vite-controller/index.ts'

interface Fixtures {
  vite: ViteController.ViteController
  project: Projector.Projector
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
  vite: async ({}, use) => {
    const viteController = ViteController.create()
    await use(viteController)
    await viteController.stopDevelopmentServer()
  },
})
