import { Schema } from '#api/schema/index'
import { Grafaid } from '#lib/grafaid/index'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index'
import { astToSchema } from '#template/lib/schema-utils/schema-utils'
import { Cache } from '@wollybeard/kit'
import type { GraphQLSchema } from 'graphql'

type WriteFile = (path: string, content: string) => Promise<void>

type ReadFile = (locator: string) => Promise<string>

type ClearDirectory = (path: string) => Promise<void>

type RemoveFile = (path: string) => Promise<void>

const NoImplementationWriteFile: WriteFile = async (path: string, content: string) => {
  throw new Error('Write operations not supported in this environment')
}

const NoImplementationClearDirectory: ClearDirectory = async (path: string) => {
  throw new Error('Directory operations not supported in this environment')
}

const NoImplementationRemoveFile: RemoveFile = async (path: string) => {
  throw new Error('File removal operations not supported in this environment')
}

interface SchemaSourceConfig {
  io: {
    read: ReadFile
    write?: WriteFile
    clearDirectory?: ClearDirectory
    removeFile?: RemoveFile
  }
  versions: string[]
  assetsPath: string
}

export const createSchemaSource = (config: SchemaSourceConfig) => {
  const getSchemaPath = (version: string) => `${config.assetsPath}/schemas/${version}.json`

  const getChangelogPath = (version: string) => `${config.assetsPath}/schemas/${version}.changelog.json`

  const getSchemasDirectory = () => `${config.assetsPath}/schemas`

  const getMetadataPath = () => `${config.assetsPath}/schemas/metadata.json`

  const ioWrite = config.io.write || NoImplementationWriteFile
  const ioClearDirectory = config.io.clearDirectory || NoImplementationClearDirectory
  const ioRemoveFile = config.io.removeFile || NoImplementationRemoveFile

  // Memoize only the base IO read operation
  const ioReadMemoized = Cache.memoize(config.io.read)

  const get = async (version: string): Promise<GraphQLSchema> => {
    const content = await ioReadMemoized(getSchemaPath(version))
    const schemaAst = JSON.parse(content)
    const schema = astToSchema(schemaAst)
    return schema
  }

  const getChangelog = async (version: string): Promise<Schema.ChangelogData> => {
    const content = await ioReadMemoized(getChangelogPath(version))
    return JSON.parse(content)
  }

  const getAllChangesets = async (): Promise<GraphqlChangeset.ChangeSet[]> => {
    const changesets: GraphqlChangeset.ChangeSet[] = []

    for (let i = 0; i < config.versions.length; i++) {
      const version = config.versions[i]
      if (!version) continue

      const schema = await get(version)
      if (!schema) continue

      // Only try to read changelog for non-oldest versions (matching writeDevAssets logic)
      let changelogData = null
      if (i < config.versions.length - 1) {
        changelogData = await getChangelog(version)
      }

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

    writeChangelog: async (version: string, changelog: Schema.ChangelogData) => {
      await ioWrite(getChangelogPath(version), JSON.stringify(changelog))
    },

    // Directory operations
    clearAllAssets: async () => {
      await ioClearDirectory(getSchemasDirectory())
    },

    removeAsset: async (version: string) => {
      try {
        await ioRemoveFile(getSchemaPath(version))
      } catch (error) {
        // Swallow errors for file removal as requested
      }

      try {
        await ioRemoveFile(getChangelogPath(version))
      } catch (error) {
        // Swallow errors for file removal as requested
      }
    },

    writeMetadata: async (metadata: Schema.SchemaMetadata) => {
      await ioWrite(getMetadataPath(), JSON.stringify(metadata, null, 2))
    },

    writeAllAssets: async (
      schemaData: Awaited<ReturnType<typeof Schema.readOrThrow>>['data'],
      metadata: Schema.SchemaMetadata,
    ) => {
      if (!schemaData) return

      // Write schema and changelog files
      for (const [index, version] of schemaData!.entries()) {
        const versionName = index === 0 ? Schema.VERSION_LATEST : Schema.dateToVersionString(version.date)

        // Write schema file
        await ioWrite(
          getSchemaPath(versionName),
          JSON.stringify(Grafaid.Schema.AST.parse(Grafaid.Schema.print(version.after))),
        )

        // Write changelog file (except for the oldest/last version)
        if (Schema.shouldVersionHaveChangelog(index, schemaData!.length)) {
          const changelogData = {
            changes: version.changes,
            date: version.date.toISOString(),
          }
          await ioWrite(getChangelogPath(versionName), JSON.stringify(changelogData))
        }
      }

      // Write metadata file
      await ioWrite(getMetadataPath(), JSON.stringify(metadata, null, 2))
    },
  }
}
