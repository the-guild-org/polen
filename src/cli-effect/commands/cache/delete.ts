import { Command } from '@effect/cli'
import { Effect, Option } from 'effect'
import { Api } from '#api/index'
import { allowGlobalParameter, projectParameter } from '../../_/parameters.js'
import { ensureOptionalAbsoluteWithCwd } from '#lib/kit-temp'
import consola from 'consola'

export const cacheDelete = Command.make(
  'delete',
  {
    project: projectParameter,
    allowGlobal: allowGlobalParameter,
  },
  ({ project, allowGlobal }) =>
    Effect.gen(function* () {
      const dir = ensureOptionalAbsoluteWithCwd(Option.getOrUndefined(project))

      yield* Effect.promise(() => Api.Cache.deleteAll(dir))
      consola.success('Polen caches deleted')
    })
)