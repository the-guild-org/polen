import { Debug } from '#lib/debug/index.js'
import { GrafaidOld } from '#lib/grafaid-old/index.js'
import type { Changelog } from '../../changelog.js'
import { glob } from 'tinyglobby'
import { FileNameExpression } from './file-name-expression/index.js'
import { GraphqlChange } from '#lib/graphql-change/index.js'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index.js'

const debug = Debug.create(`polen:changelog:data-source-sdl-files`)

export const readOrThrow = async (parameters: { path: string }): Promise<null | Changelog> => {
  debug(`will search`, parameters)
  const filePaths = await glob({
    cwd: parameters.path,
    absolute: true,
    onlyFiles: true,
    patterns: [`*.graphql`],
  })
  debug(`did find`, filePaths)

  if (filePaths.length === 0) return null

  const fileNameExpressions = filePaths.map(FileNameExpression.parseOrThrow)
  debug(`parsed file names`, fileNameExpressions)

  const iterations = await Promise.all(fileNameExpressions.map(async fileNameExpression => {
    const schemaFile = await GrafaidOld.Schema.read(fileNameExpression.filePath)
    return {
      ...fileNameExpression,
      schema: schemaFile.content,
    }
  }))
  debug(`read schemas`)

  iterations.sort((a, b) => a.date.getTime() - b.date.getTime())

  const changesets = (await Promise.all(
    iterations.map(async (iteration, index): Promise<GraphqlChangeset.ChangeSet> => {
      const current = iteration
      const previous = iterations[index - 1]

      const before = previous?.schema ?? GrafaidOld.Schema.empty
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
  )).reverse()

  debug(`computed changelog`)

  const changelog: Changelog = {
    changesets,
  }

  return changelog
}
