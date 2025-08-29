import { Projector } from '@wollybeard/projector'
import { test as base } from 'vitest'

interface Fixtures {
  project: Projector.Projector
  project2: Projector.Projector
}

export const test = base.extend<Fixtures>({
  project: async ({}, use) => {
    const controller = await Projector.create({})
    await use(controller)
  },
  project2: async ({}, use) => {
    const controller = await Projector.create({})
    await use(controller)
  },
})
