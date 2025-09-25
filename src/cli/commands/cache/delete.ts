import { Api } from '#api/$'
import { Ef, Op, S } from '#dep/effect'
import { Command } from '@effect/cli'
import { NodeFileSystem } from '@effect/platform-node'
import { FsLoc } from '@wollybeard/kit'
import consola from 'consola'
import { allowGlobalParameter, projectParameter } from '../../_/parameters.js'

export const cacheDelete = Command.make(
  'delete',
  {
    project: projectParameter,
    allowGlobal: allowGlobalParameter,
  },
  ({ project, allowGlobal }) =>
    Ef.gen(function*() {
      const dir = Op.getOrElse(
        Op.map(project, p => S.decodeSync(FsLoc.AbsDir.String)(p)),
        () => S.decodeSync(FsLoc.AbsDir.String)(process.cwd()),
      )

      yield* Api.Cache.deleteAll(dir).pipe(
        Ef.provide(NodeFileSystem.layer),
      )
      consola.success('Polen caches deleted')
    }),
)
