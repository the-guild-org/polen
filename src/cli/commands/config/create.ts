import { Api } from '#api/$'
import { O } from '#dep/effect'
import { Command } from '@effect/cli'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@wollybeard/kit'
import consola from 'consola'
import { Effect } from 'effect'

import { allowGlobalParameter, projectParameter } from '../../_/parameters.js'

export const configCreate = Command.make(
  'create',
  {
    project: projectParameter,
    allowGlobal: allowGlobalParameter,
  },
  ({ project, allowGlobal }) =>
    Effect.gen(function*() {
      const dir = Path.ensureOptionalAbsoluteWithCwd(O.getOrUndefined(project))

      const isValidProject = yield* Api.Project.validateProjectDirectory(dir).pipe(
        Effect.provide(NodeFileSystem.layer),
      )
      if (!isValidProject) {
        return yield* Effect.fail(new Error('Invalid project directory'))
      }

      const fileName = 'polen.config.ts'
      const fileContent = `import { Polen } from 'polen'

export default Polen.defineConfig({
  // Your configuration options
})
`

      const filePath = Path.join(dir, fileName)

      const fs = yield* FileSystem
      const existsResult = yield* Effect.either(fs.stat(filePath))
      if (existsResult._tag === 'Right') {
        consola.info(`Polen configuration file already exists at ${fileName}`)
        return
      }

      yield* fs.writeFileString(filePath, fileContent)

      consola.success(`Created Polen configuration file at ${fileName}`)
    }).pipe(Effect.provide(NodeFileSystem.layer)),
)
