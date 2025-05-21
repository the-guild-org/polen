import { ProjectController } from '@wollybeard/kit'
import { test as base } from 'vitest'

interface Fixtures {
  project: ProjectController.ProjectController
  project2: ProjectController.ProjectController
}

export const unit = base.extend<Fixtures>({
  project: async ({}, use) => {
    const controller = await ProjectController.create({})
    await use(controller)
  },
  project2: async ({}, use) => {
    const controller = await ProjectController.create({})
    await use(controller)
  },
})
