import { Api } from '#api/$'
import { O } from '#dep/effect'
import { Command } from '@effect/cli'
import { NodeFileSystem } from '@effect/platform-node'
import { Path } from '@wollybeard/kit'
import consola from 'consola'
import { Effect } from 'effect'
import { allowGlobalParameter, projectParameter } from '../../_/parameters.js'

export const cacheDelete = Command.make(
  'delete',
  {
    project: projectParameter,
    allowGlobal: allowGlobalParameter,
  },
  ({ project, allowGlobal }) =>
    Effect.gen(function*() {
      const dir = Path.ensureOptionalAbsoluteWithCwd(O.getOrUndefined(project))

      yield* Api.Cache.deleteAll(dir).pipe(
        Effect.provide(NodeFileSystem.layer),
      )
      consola.success('Polen caches deleted')
    }),
)
