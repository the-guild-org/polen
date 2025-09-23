import { InputSource } from '#api/schema/input-source/$'
import { Ar } from '#dep/effect'
import { Ef } from '#dep/effect'
import type { GraphQLSchema } from 'graphql'
import { Catalog, Change, DateOnly, Grafaid, Revision, Schema } from 'graphql-kit'

/**
 * Configuration for defining schemas programmatically in memory.
 *
 * Useful for demos, testing, or when schemas are generated dynamically.
 */
export interface Options {
  /**
   * Schema revisions defined in various formats.
   *
   * Can be:
   * - A single SDL string (single revision, no changelog)
   * - Array of SDL strings (uses current date for all)
   * - Array of objects with date and SDL (full changelog support)
   * - A GraphQLSchema object (single revision, no changelog)
   * - Array of GraphQLSchema objects (uses current date for all)
   * - Array of objects with date and GraphQLSchema (full changelog support)
   * - A pre-built unversioned Catalog object
   *
   * @example
   * ```ts
   * // Single SDL schema revision
   * revisions: `
   *   type Query {
   *     hello: String
   *   }
   * `
   *
   * // Multiple revisions with explicit dates (enables changelog)
   * revisions: [
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
   * revisions: buildSchema(`type Query { hello: String }`)
   *
   * // Pre-built unversioned catalog
   * revisions: myCatalog
   * ```
   */
  revisions?:
    | string
    | string[]
    | { date: Date; value: string }[]
    | GraphQLSchema
    | GraphQLSchema[]
    | { date: Date; value: GraphQLSchema }[]
    | Catalog.Unversioned
}

export interface Config {
  revisions: { date: Date; value: string | GraphQLSchema }[] | Catalog.Unversioned
}

// Type guard to check if value is a GraphQLSchema
const isGraphQLSchema = (value: unknown): value is GraphQLSchema => {
  return value !== null && typeof value === 'object' && '_typeMap' in value
}

export const normalize = (configInput: Options): Config => {
  // If it's already a Catalog, return it as-is
  if (Catalog.is(configInput.revisions)) {
    return {
      revisions: configInput.revisions,
    }
  }

  // Handle undefined/null revisions
  if (!configInput.revisions) {
    return {
      revisions: [],
    }
  }

  // Convert all other formats to normalized array format
  const revisionsArray = Ar.isArray(configInput.revisions) ? configInput.revisions : [configInput.revisions]

  const config: Config = {
    revisions: Ar.map(revisionsArray, (item) => {
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

const parseSchema = (value: string | GraphQLSchema): Ef.Effect<GraphQLSchema, InputSource.InputSourceError> =>
  Ef.gen(function*() {
    if (typeof value === 'string') {
      const ast = yield* Grafaid.Parse.parseSchema(value, { source: 'memory' }).pipe(
        Ef.mapError((error) =>
          new InputSource.InputSourceError({
            source: 'memory',
            message: error.message,
            cause: error,
          })
        ),
      )
      return yield* Grafaid.Schema.fromAST(ast).pipe(
        Ef.mapError((error) =>
          new InputSource.InputSourceError({
            source: 'memory',
            message: error.message,
            cause: error,
          })
        ),
      )
    }
    return value // Already a GraphQLSchema
  })

export const read = (
  options: Options,
): Ef.Effect<
  null | { schema: Schema.Unversioned.Unversioned; revisions: readonly Revision[] },
  InputSource.InputSourceError
> =>
  Ef.gen(function*() {
    const config = normalize(options)

    // If it's already a Catalog, extract schema and revisions
    if (Catalog.Unversioned.is(config.revisions)) {
      return {
        schema: config.revisions.schema,
        revisions: [...config.revisions.schema.revisions],
      }
    }

    if (!Ar.isNonEmptyArray(config.revisions)) {
      return null
    }

    const parsedRevisions = yield* Ef.all(
      Ar.map(config.revisions, (item) =>
        Ef.gen(function*() {
          const schema = yield* parseSchema(item.value)
          return {
            date: item.date,
            schema,
          }
        })),
      { concurrency: 'unbounded' },
    )

    // Sort revisions newest first
    parsedRevisions.sort((a, b) => b.date.getTime() - a.date.getTime())

    const revisions = yield* Ef.all(
      Ar.map(parsedRevisions, (revision, index) =>
        Ef.gen(function*() {
          const current = revision
          const previous = parsedRevisions[index - 1]

          // Skip changeset calculation for the newest revision (first in array after sorting)
          let changes: Change.Change[]
          if (!previous) {
            // For the newest revision, we don't have changes - just an empty array
            changes = []
          } else {
            // Fix: Swap before/after to calculate changes correctly
            // previous is NEWER (lower index), current is OLDER (higher index)
            const before = current.schema // older
            const after = previous.schema // newer

            changes = yield* Change.calcChangeset({ before, after }).pipe(
              Ef.mapError((error) =>
                new InputSource.InputSourceError({
                  source: 'memory',
                  message: `Failed to calculate changeset: ${error}`,
                  cause: error,
                })
              ),
            )
          }

          return Revision.make({
            date: DateOnly.make(current.date.toISOString().split('T')[0]!),
            changes,
          })
        })),
      { concurrency: 1 }, // Keep sequential for correct changeset calculation
    )

    // Get the latest schema (first after sorting newest first)
    const latestSchemaData = parsedRevisions[0]?.schema
    if (!latestSchemaData) return null

    const schema = Schema.Unversioned.make({
      revisions: revisions, // Already sorted newest first
      definition: latestSchemaData, // GraphQLSchema object
    })

    return {
      schema: schema,
      revisions: schema.revisions,
    }
  })

export const loader = InputSource.create({
  name: 'memory',
  isApplicable: (options: Options, _context) =>
    Ef.succeed(options.revisions !== undefined && options.revisions !== null),
  readIfApplicableOrThrow: (options: Options, _context) =>
    Ef.gen(function*() {
      const config = normalize(options)

      // If it's already a Catalog, return it directly
      if (Catalog.is(config.revisions)) {
        return config.revisions
      }

      if (!Ar.isNonEmptyArray(config.revisions)) {
        return null
      }

      const result = yield* read(options)
      if (!result) return null

      return Catalog.Unversioned.make({
        schema: result.schema,
      })
    }),
})
