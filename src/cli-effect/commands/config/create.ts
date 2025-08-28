import { Api } from '#api/index'
import { ensureOptionalAbsoluteWithCwd } from '#lib/kit-temp'
import { Command } from '@effect/cli'
import { Fs, Path } from '@wollybeard/kit'
import consola from 'consola'
import { Effect, Option } from 'effect'
import { allowGlobalParameter, projectParameter } from '../../_/parameters.js'

export const configCreate = Command.make(
  'create',
  {
    project: projectParameter,
    allowGlobal: allowGlobalParameter,
  },
  ({ project, allowGlobal }) =>
    Effect.gen(function*() {
      const dir = ensureOptionalAbsoluteWithCwd(Option.getOrUndefined(project))

      const isValidProject = yield* Effect.promise(() => Api.Project.validateProjectDirectory(dir))
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

      const exists = yield* Effect.promise(() => Fs.exists(filePath))
      if (exists) {
        consola.info(`Polen configuration file already exists at ${fileName}`)
        return
      }

      yield* Effect.promise(() =>
        Fs.write({
          path: filePath,
          content: fileContent,
        })
      )

      consola.success(`Created Polen configuration file at ${fileName}`)
    }),
)
