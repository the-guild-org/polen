import { Api } from '#api/$'
import { Command } from '@effect/cli'
import consola from 'consola'
import { Effect, Option } from 'effect'
import { ensureOptionalAbsoluteWithCwd } from 'graphql-kit'
import { allowGlobalParameter, projectParameter } from '../../_/parameters.js'

export const cacheDelete = Command.make(
  'delete',
  {
    project: projectParameter,
    allowGlobal: allowGlobalParameter,
  },
  ({ project, allowGlobal }) =>
    Effect.gen(function*() {
      const dir = ensureOptionalAbsoluteWithCwd(Option.getOrUndefined(project))

      yield* Effect.promise(() => Api.Cache.deleteAll(dir))
      consola.success('Polen caches deleted')
    }),
)
