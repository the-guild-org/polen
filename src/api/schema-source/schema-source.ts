import { Schema } from '#api/schema/index'
import { Grafaid } from '#lib/grafaid'
import { GraphqlChangeset } from '#lib/graphql-changeset'
import { SchemaLifecycle } from '#lib/schema-lifecycle'
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
  debug?: boolean
}

export const createSchemaSource = (config: SchemaSourceConfig) => {
  const getSchemaPath = (version: string) => `${config.assetsPath}/schemas/${version}.json`

  const getChangelogPath = (version: string) => `${config.assetsPath}/schemas/${version}.release.changelog.json`

  const getSchemasDirectory = () => `${config.assetsPath}/schemas`

  const getMetadataPath = () => `${config.assetsPath}/schemas/metadata.json`

  const getLifecyclePath = () => `${config.assetsPath}/schemas/lifecycle.json`

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

  const getChangelog = async (version: string): Promise<GraphqlChangeset.ChangeSet> => {
    const content = await ioReadMemoized(getChangelogPath(version))
    return GraphqlChangeset.fromJson(content)
  }

  const getAllChangesets = async (): Promise<GraphqlChangeset.Changelog> => {
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

        if (prevVersion) {
          const prevSchema = await get(prevVersion)
          changesets.push({
            type: 'IntermediateChangeSet',
            after: { data: schema, version },
            before: { data: prevSchema, version: prevVersion },
            changes: GraphqlChangeset.isIntermediateChangeSet(changelogData) ? changelogData.changes : [],
            date: new Date(changelogData.date),
          })
        }
      } else {
        // Oldest version - no changelog, use existing utility
        changesets.push({
          type: 'InitialChangeSet',
          date: Schema.versionStringToDate(version),
          after: { data: schema, version },
        })
      }
    }

    return changesets as GraphqlChangeset.Changelog
  }

  const getLifecycle = async (): Promise<SchemaLifecycle.SchemaLifecycle> => {
    const content = await ioReadMemoized(getLifecyclePath())
    return SchemaLifecycle.fromJson(content)
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
    getLifecycle,

    // Expose the memoized reader's clear method
    clearCache: ioReadMemoized.clear,

    // Write operations (use the writer, which throws if not provided)
    writeSchema: async (version: string, schema: GraphQLSchema) => {
      const ast = Grafaid.Schema.AST.parse(Grafaid.Schema.print(schema))
      await ioWrite(getSchemaPath(version), JSON.stringify(ast))
    },

    writeChangelog: async (version: string, changelog: GraphqlChangeset.ChangeSet) => {
      await ioWrite(
        getChangelogPath(version),
        GraphqlChangeset.toJson(changelog),
      )
    },

    writeLifecycle: async (lifecycle: SchemaLifecycle.SchemaLifecycle) => {
      await ioWrite(getLifecyclePath(), SchemaLifecycle.toJson(lifecycle))
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
      changelog: GraphqlChangeset.Changelog,
      metadata: Schema.SchemaMetadata,
      lifecycle?: SchemaLifecycle.SchemaLifecycle,
    ) => {
      if (!changelog) return

      // Write schema and changelog files
      for (const [index, changeset] of changelog.entries()) {
        const versionName = index === 0 ? Schema.VERSION_LATEST : Schema.dateToVersionString(changeset.date)

        // Write schema file
        if (changeset.after?.data) {
          await ioWrite(
            getSchemaPath(versionName),
            JSON.stringify(Grafaid.Schema.AST.parse(Grafaid.Schema.print(changeset.after.data))),
          )
        }

        // Write changelog file only for intermediate changesets
        if (GraphqlChangeset.isIntermediateChangeSet(changeset)) {
          await ioWrite(
            getChangelogPath(versionName),
            GraphqlChangeset.toJson(changeset),
          )
        }
      }

      // Write metadata file
      await ioWrite(getMetadataPath(), JSON.stringify(metadata, null, 2))

      // Write lifecycle file if provided
      if (lifecycle) {
        await ioWrite(
          getLifecyclePath(),
          SchemaLifecycle.toJson(lifecycle),
        )
      }
    },
  }
}
