import { Ef } from '#dep/effect'
import { NodeFileSystem } from '@effect/platform-node'
import { Dir } from '@wollybeard/kit'
import { Test } from '@wollybeard/kit/test'
import { Projector } from '@wollybeard/projector'
import { Context, Layer } from 'effect'
import { expect } from 'vitest'
import { scan } from './scan.js'

// Create service tag for Projector
class ProjectorService extends Context.Tag('ProjectorService')<
  ProjectorService,
  Projector.Projector
>() {}

// Create layer for Projector with FileSystem
const ProjectorServiceLayer = Layer.orDie(
  Layer.effect(
    ProjectorService,
    Projector.create({}),
  ),
)

const ProjectorLive = Layer.provideMerge(
  Layer.merge(ProjectorServiceLayer, NodeFileSystem.layer),
  NodeFileSystem.layer,
)

const dir = Dir.spec('/')

Test.Table.suiteWithLayers(ProjectorLive)<
  Dir.SpecBuilder,
  {
    diagnosticCount?: number
    routes?: Array<{ path: readonly string[]; order?: number }>
  }
>(
  'scan', // dprint-ignore
  [
  {
    n: 'literal at root',
    i: dir.add('a.md', ''),
    o: {
      routes: [{ path: ['a'] }]
    },
  },
  {
    n: 'literal nested',
    i: dir.add('a/b.md', ''),
    o: {
      routes: [{ path: ['a', 'b'] }]
    },
  },
  {
    n: 'index at root',
    i: dir.add('index.md', ''),
    o: {
      routes: [{ path: [] }]
    },
  },
  {
    n: 'index nested',
    i: dir.add('a/index.md', ''),
    o: {
      routes: [{ path: ['a'] }]
    },
  },
  {
    n: 'catches literal+index file route conflict',
    i: dir.add('a.md', '').add('a/index.md', ''),
    o: {
      diagnosticCount: 1,
      routes: [{ path: ['a'] }]
    },
  },
],
  ({ i, o }) =>
    Ef.gen(function*() {
      const projector = yield* ProjectorService
      const dir = Dir.chain(Dir.create(projector.dir.base as any))

      // Write test files from spec
      yield* dir.merge(i).commit()

      // Run scan
      const result = yield* scan({
        dir: dir.base,
        glob: '**/*.md',
      })

      // Check expectations
      if (o.routes !== undefined) {
        expect(result.routes).toHaveLength(o.routes.length)
        const actualPaths = result.routes.map(r => r.logical.path.segments)
        const expectedPaths = o.routes.map(r => r.path)
        expect(actualPaths).toEqual(expect.arrayContaining(expectedPaths))
      }

      if (o.diagnosticCount !== undefined) {
        expect(result.diagnostics).toHaveLength(o.diagnosticCount)
      }
    }) as any,
)
