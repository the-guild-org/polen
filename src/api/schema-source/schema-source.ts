import { Schema } from '#api/schema/index'
import { Grafaid } from '#lib/grafaid/index'
import type { GraphqlChange } from '#lib/graphql-change/index'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index'
import { astToSchema } from '#template/lib/schema-utils/schema-utils'
import { Cache } from '@wollybeard/kit'
import type { GraphQLSchema } from 'graphql'

type WriteFile = (path: string, content: string) => Promise<void>

type ReadFile = (path: string) => Promise<string>

const NoImplementationWriteFile: WriteFile = async (path: string, content: string) => {
  throw new Error('Write operations not supported in this environment')
}

interface SchemaSourceConfig {
  io: {
    read: ReadFile
    write?: WriteFile
  }
  versions: string[]
  assetsPath: string
}

export const createSchemaSource = (config: SchemaSourceConfig) => {
  const getSchemaPath = (version: string) => `${config.assetsPath}/schemas/${version}.json`

  const getChangelogPath = (version: string) => `${config.assetsPath}/schemas/${version}.changelog.json`

  const ioWrite = config.io.write || NoImplementationWriteFile

  // Memoize only the base IO read operation
  const ioReadMemoized = Cache.memoize(config.io.read)

  const get = async (version: string): Promise<GraphQLSchema | null> => {
    try {
      const content = await ioReadMemoized(getSchemaPath(version))
      const schemaAst = JSON.parse(content)
      const schema = astToSchema(schemaAst)
      return schema
    } catch (error) {
      console.error(`Failed to load schema:`, error)
      return null
    }
  }

  const getChangelog = async (version: string): Promise<{ changes: GraphqlChange.Change[]; date: string } | null> => {
    try {
      const content = await ioReadMemoized(getChangelogPath(version))
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  const getAllChangesets = async (): Promise<GraphqlChangeset.ChangeSet[]> => {
    const changesets: GraphqlChangeset.ChangeSet[] = []

    for (let i = 0; i < config.versions.length; i++) {
      const version = config.versions[i]
      if (!version) continue

      const schema = await get(version)
      if (!schema) continue

      const changelogData = await getChangelog(version)

      if (changelogData) {
        const prevVersion = config.versions[i + 1]
        const prevSchema = prevVersion ? await get(prevVersion) : null

        if (prevSchema) {
          changesets.push({
            after: schema,
            before: prevSchema,
            changes: changelogData.changes,
            date: new Date(changelogData.date),
          })
        }
      } else {
        // Oldest version - no changelog, use existing utility
        changesets.push({
          after: schema,
          before: Grafaid.Schema.empty,
          changes: [],
          date: Schema.versionStringToDate(version),
        })
      }
    }

    return changesets
  }

  return {
    //
    // Properties
    //
    versions: config.versions,
    isEmpty: config.versions.length === 0,

    //
    // Methods
    //
    get,
    getChangelog,
    getAllChangesets,

    // Expose the memoized reader's clear method
    clearCache: ioReadMemoized.clear,

    // Write operations (use the writer, which throws if not provided)
    writeSchema: async (version: string, schema: GraphQLSchema) => {
      const ast = Grafaid.Schema.AST.parse(Grafaid.Schema.print(schema))
      await ioWrite(getSchemaPath(version), JSON.stringify(ast))
    },

    writeChangelog: async (version: string, changelog: { changes: GraphqlChange.Change[]; date: string }) => {
      await ioWrite(getChangelogPath(version), JSON.stringify(changelog))
    },
  }
}
