import { InputSource } from '#api/schema/input-source/$'
import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { DateOnly } from '#lib/date-only/$'
import { Grafaid } from '#lib/grafaid'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'
import { Arr } from '@wollybeard/kit'
import type { GraphQLSchema } from 'graphql'

/**
 * Configuration for defining schemas programmatically in memory.
 *
 * Useful for demos, testing, or when schemas are generated dynamically.
 */
export interface Options {
  /**
   * Schema versions defined in various formats.
   *
   * Can be:
   * - A single SDL string (no changelog)
   * - Array of SDL strings (uses current date for all)
   * - Array of objects with date and SDL (full changelog support)
   * - A GraphQLSchema object (no changelog)
   * - Array of GraphQLSchema objects (uses current date for all)
   * - Array of objects with date and GraphQLSchema (full changelog support)
   * - A pre-built Catalog object
   *
   * @example
   * ```ts
   * // Single SDL schema
   * versions: `
   *   type Query {
   *     hello: String
   *   }
   * `
   *
   * // Multiple versions with explicit dates
   * versions: [
   *   {
   *     date: new Date('2024-01-15'),
   *     value: `type Query { users: [User] }`
   *   },
   *   {
   *     date: new Date('2024-03-20'),
   *     value: `type Query { users: [User], posts: [Post] }`
   *   }
   * ]
   *
   * // GraphQL schema object
   * versions: buildSchema(`type Query { hello: String }`)
   *
   * // Pre-built catalog
   * versions: myCatalog
   * ```
   */
  versions:
    | string
    | string[]
    | { date: Date; value: string }[]
    | GraphQLSchema
    | GraphQLSchema[]
    | { date: Date; value: GraphQLSchema }[]
    | Catalog.Catalog
}

export interface Config {
  versions: { date: Date; value: string | GraphQLSchema }[] | Catalog.Catalog
}

// Type guard to check if value is a Catalog
const isCatalog = (value: unknown): value is Catalog.Catalog => {
  return value !== null
    && typeof value === 'object'
    && '_tag' in value
    && ((value as any)._tag === 'CatalogUnversioned' || (value as any)._tag === 'CatalogVersioned')
}

// Type guard to check if value is a GraphQLSchema
const isGraphQLSchema = (value: unknown): value is GraphQLSchema => {
  return value !== null && typeof value === 'object' && '_typeMap' in value
}

export const normalize = (configInput: Options): Config => {
  // If it's already a Catalog, return it as-is
  if (isCatalog(configInput.versions)) {
    return {
      versions: configInput.versions,
    }
  }

  // Convert all other formats to normalized array format
  const versionsArray = Arr.sure(configInput.versions)

  const config: Config = {
    versions: Arr.map(versionsArray, (item) => {
      // Handle string (SDL)
      if (typeof item === 'string') {
        return {
          date: new Date(),
          value: item,
        }
      }

      // Handle GraphQLSchema object
      if (isGraphQLSchema(item)) {
        return {
          date: new Date(),
          value: item,
        }
      }

      // Handle { date, value } where value could be string or GraphQLSchema
      return item
    }),
  }

  return config
}

export const read = async (
  options: Options,
): Promise<null | { schema: Schema.Unversioned.Unversioned; revisions: Revision.Revision[] }> => {
  const config = normalize(options)

  // If it's already a Catalog, extract schema and revisions
  if (isCatalog(config.versions)) {
    if (config.versions._tag === 'CatalogUnversioned') {
      return {
        schema: config.versions.schema,
        revisions: [...config.versions.revisions],
      }
    } else {
      // For versioned catalog, return the latest entry
      const latestEntry = config.versions.entries[0]
      if (!latestEntry) return null
      return {
        schema: latestEntry.schema as any, // TODO: handle versioned to unversioned conversion
        revisions: [...latestEntry.revisions],
      }
    }
  }

  if (!Arr.isntEmpty(config.versions)) {
    return null
  }

  const versions = Arr.map(config.versions, _ => {
    return {
      date: _.date,
      schema: typeof _.value === 'string'
        ? Grafaid.Schema.fromAST(Grafaid.Schema.AST.parse(_.value))
        : _.value, // Already a GraphQLSchema
    }
  })

  versions.sort((a, b) => a.date.getTime() - b.date.getTime())

  const revisions = await Promise.all(
    Arr.map(versions, async (version, index): Promise<Revision.Revision> => {
      const current = version
      const previous = versions[index - 1]

      const before = previous?.schema ?? Grafaid.Schema.empty
      const after = current.schema

      const changes = await Change.calcChangeset({
        before,
        after,
      })

      return Revision.make({
        date: DateOnly.make(current.date.toISOString().split('T')[0]!),
        changes,
      })
    }),
  )

  // Get the latest schema
  const latestSchemaData = versions[versions.length - 1]?.schema
  if (!latestSchemaData) return null

  // Create unversioned schema
  const schema = Schema.Unversioned.make({
    revisions: revisions.slice().reverse(), // Back to chronological order
    definition: latestSchemaData, // GraphQLSchema object
  })

  // Reverse revisions to have newest first
  revisions.reverse()

  return { schema, revisions }
}

export const loader = InputSource.create({
  name: 'memory',
  readIfApplicableOrThrow: async (options: Options) => {
    const config = normalize(options)

    // If it's already a Catalog, return it directly
    if (isCatalog(config.versions)) {
      return config.versions
    }

    if (!Arr.isntEmpty(config.versions)) {
      return null
    }

    const result = await read(options)
    if (!result) return null

    return Catalog.Unversioned.make({
      schema: result.schema,
      revisions: result.revisions,
    })
  },
})
