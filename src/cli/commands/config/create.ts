import { Api } from '#api/$'
import { Ef, Op, S } from '#dep/effect'
import { Command } from '@effect/cli'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Fs, FsLoc } from '@wollybeard/kit'
import consola from 'consola'

import { allowGlobalParameter, projectParameter } from '../../_/parameters.js'

export const configCreate = Command.make(
  'create',
  {
    project: projectParameter,
    allowGlobal: allowGlobalParameter,
  },
  ({ project, allowGlobal }) =>
    Ef.gen(function*() {
      const dir = Op.getOrElse(Op.map(project, p => S.decodeSync(FsLoc.AbsDir.String)(p)), () =>
        S.decodeSync(FsLoc.AbsDir.String)(process.cwd()))
      // const dir = Path.ensureOptionalAbsoluteWithCwd(Op.getOrUndefined(project))

      const isValidProject = yield* Api.Project.validateProjectDirectory(dir).pipe(
        Ef.provide(NodeFileSystem.layer),
      )
      if (!isValidProject) {
        return yield* Ef.fail(new Error('Invalid project directory'))
      }

      const fileName = FsLoc.fromString('polen.config.ts')
      const fileContent = `import { Polen } from 'polen'

export default Polen.defineConfig({
  // Your configuration options
})
`

      const filePath = FsLoc.join(dir, fileName)

      const existsResult = yield* Ef.either(Fs.stat(filePath))
      if (existsResult._tag === 'Right') {
        consola.info(`Polen configuration file already exists at ${fileName}`)
        return
      }

      yield* Fs.write(filePath, fileContent)

      consola.success(`Created Polen configuration file at ${fileName}`)
    }).pipe(Ef.provide(NodeFileSystem.layer)),
)
