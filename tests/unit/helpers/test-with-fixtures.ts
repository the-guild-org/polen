import { Ef } from '#dep/effect'
import { NodeFileSystem } from '@effect/platform-node'
import { it } from '@effect/vitest'
import { Projector } from '@wollybeard/projector'
import { Context, Layer } from 'effect'

// Create service tags for Projector instances
class ProjectorService extends Context.Tag('ProjectorService')<
  ProjectorService,
  Projector.Projector
>() {}

class ProjectorService2 extends Context.Tag('ProjectorService2')<
  ProjectorService2,
  Projector.Projector
>() {}

// Create layers for Projector instances
export const ProjectorLive = Layer.effect(
  ProjectorService,
  Projector.create({}),
).pipe(Layer.provide(NodeFileSystem.layer))

export const ProjectorLive2 = Layer.effect(
  ProjectorService2,
  Projector.create({}),
).pipe(Layer.provide(NodeFileSystem.layer))

export const ProjectorDualLive = Layer.merge(
  ProjectorLive,
  ProjectorLive2,
)

// Export tags for use in tests
export const ProjectorTag = ProjectorService
export const ProjectorTag2 = ProjectorService2

// Export it from @effect/vitest for tests to use
export { it }

// Create test with project fixture for compatibility
export const test = it.scoped('test with project', () =>
  Ef.map(ProjectorService, (projector) => ({
    project: {
      dir: projector.dir,
    },
  }))).pipe(it.provide(ProjectorLive))
