import { Api } from '#api/$'
import { Op } from '#dep/effect'
import { Ef } from '#dep/effect'
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
        Op.map(project, FsLoc.AbsDir.decodeSync),
        () => FsLoc.AbsDir.decodeSync(process.cwd()),
      )

      yield* Api.Cache.deleteAll(dir).pipe(
        Ef.provide(NodeFileSystem.layer),
      )
      consola.success('Polen caches deleted')
    }),
)
