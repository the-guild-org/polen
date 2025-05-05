import { Debug } from '#lib/debug/index.js'
import type { Schema } from '../../schema.js'
import { glob } from 'tinyglobby'
import { FileNameExpression } from './file-name-expression/index.js'
import { GraphqlChange } from '#lib/graphql-change/index.js'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index.js'
import { Path } from '#dep/path/index.js'
import { Grafaid } from '#lib/grafaid/index.js'
import type { NonEmptyArray } from '#lib/prelude/prelude.js'

const debug = Debug.create(`polen:changelog:data-source-sdl-files`)

const paths = {
  schemaDirectory: `./schema`,
}

export const readOrThrow = async (parameters: { path: string }): Promise<null | Schema> => {
  const directoryPath = Path.join(parameters.path, paths.schemaDirectory)

  debug(`will search`, parameters)
  const filePaths = await glob({
    cwd: directoryPath,
    absolute: true,
    onlyFiles: true,
    patterns: [`*.graphql`],
  })
  debug(`did find`, filePaths)

  if (filePaths.length === 0) return null

  const fileNameExpressions = filePaths.map(FileNameExpression.parseOrThrow)
  debug(`parsed file names`, fileNameExpressions)

  const iterations = await Promise.all(fileNameExpressions.map(async fileNameExpression => {
    const schemaFile = await Grafaid.Schema.read(fileNameExpression.filePath)
    // Should never happen since these paths come from the glob.
    if (!schemaFile) throw new Error(`Failed to read schema file: ${fileNameExpression.filePath}`)

    return {
      ...fileNameExpression,
      schema: schemaFile.content,
    }
  }))
  debug(`read schemas`)

  iterations.sort((a, b) => a.date.getTime() - b.date.getTime())

  const changesets = await Promise.all(
    iterations.map(async (iteration, index): Promise<GraphqlChangeset.ChangeSet> => {
      const current = iteration
      const previous = iterations[index - 1]

      const before = previous?.schema ?? Grafaid.Schema.empty
      const after = current.schema

      const changes = await GraphqlChange.calcChangeset({
        before,
        after,
      })

      return {
        date: current.date,
        before,
        after,
        changes,
      }
    }),
  )

  changesets.reverse()

  // We check for empty above so cast is safe.
  const changesetsNotEmpty = changesets as NonEmptyArray<GraphqlChangeset.ChangeSet>

  debug(`computed changelog`)

  const changelog: Schema = {
    versions: changesetsNotEmpty,
  }

  return changelog
}
