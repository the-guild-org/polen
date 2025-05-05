import { Debug } from '#lib/debug/index.js'
import type { Schema } from '../../schema.js'
import { glob } from 'tinyglobby'
import { FileNameExpression } from './file-name-expression/index.js'
import { GraphqlChange } from '#lib/graphql-change/index.js'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index.js'
import { Path } from '#dep/path/index.js'
import { Grafaid } from '#lib/grafaid/index.js'
import { Arr } from '#lib/prelude/prelude.js'

const debug = Debug.create(`polen:schema:data-source-schema-directory`)

const defaultPaths = {
  schemaDirectory: `./schema`,
}

export interface ConfigInput {
  path?: string
  projectRoot?: string
}

export interface Config {
  path: string
}

export const normalizeConfig = (configInput: ConfigInput): Config => {
  const config: Config = {
    path: Path.absolutify(
      configInput.path ?? defaultPaths.schemaDirectory,
      configInput.projectRoot,
    ),
  }

  return config
}

export const readOrThrow = async (configInput: ConfigInput): Promise<null | Schema> => {
  const config = normalizeConfig(configInput)

  debug(`will search`, config)
  const filePaths = await glob({
    cwd: config.path,
    absolute: true,
    onlyFiles: true,
    patterns: [`*.graphql`],
  })
  debug(`did find`, filePaths)

  if (!Arr.isNotEmpty(filePaths)) {
    return null
  }

  const fileNameExpressions = Arr.map(filePaths, FileNameExpression.parseOrThrow)
  debug(`parsed file names`, fileNameExpressions)

  const versions = await Promise.all(Arr.map(fileNameExpressions, async fileNameExpression => {
    const schemaFile = await Grafaid.Schema.read(fileNameExpression.filePath)
    // Should never happen since these paths come from the glob.
    if (!schemaFile) throw new Error(`Failed to read schema file: ${fileNameExpression.filePath}`)

    return {
      ...fileNameExpression,
      schema: schemaFile.content,
    }
  }))
  debug(`read schemas`)

  versions.sort((a, b) => a.date.getTime() - b.date.getTime())

  const changesets = await Promise.all(
    Arr.map(versions, async (version, index): Promise<GraphqlChangeset.ChangeSet> => {
      const current = version
      const previous = versions[index - 1]

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

  const schema: Schema = {
    versions: changesets,
  }

  debug(`computed schema`)

  return schema
}
