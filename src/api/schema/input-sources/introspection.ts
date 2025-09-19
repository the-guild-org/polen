import { InputSource } from '#api/schema/input-source/$'
import { PlatformError } from '@effect/platform/Error'
import { FileSystem } from '@effect/platform/FileSystem'
import { Json, Path } from '@wollybeard/kit'
import { Effect } from 'effect'
import { Catalog, Change, DateOnly, Grafaid, GraphqlSchemaLoader, Revision, Schema } from 'graphql-kit'
import { createHash } from 'node:crypto'
import * as IntrospectionSchema from './introspection-schema.js'

/**
 * Configuration for loading schema via GraphQL introspection.
 *
 * This source automatically fetches the schema from a GraphQL endpoint
 * and caches it locally in `.polen/cache/introspection/`.
 *
 * The cache can be cleared by deleting the `.polen/cache` directory
 * or by using the reCreate functionality.
 *
 * @example
 * ```ts
 * // Basic introspection
 * introspection: {
 *   url: 'https://api.example.com/graphql'
 * }
 *
 * // With authentication
 * introspection: {
 *   url: 'https://api.example.com/graphql',
 *   headers: {
 *     'Authorization': `Bearer ${process.env.API_TOKEN}`
 *   }
 * }
 * ```
 */
export interface Options {
  /**
   * The GraphQL endpoint URL to introspect.
   *
   * Must be a valid GraphQL endpoint that supports introspection queries.
   *
   * @example 'https://api.example.com/graphql'
   */
  url?: string
  /**
   * Optional headers to include in the introspection request.
   *
   * Use this for authentication, API keys, or any custom headers
   * required by your GraphQL endpoint.
   *
   * @example
   * ```ts
   * headers: {
   *   'Authorization': `Bearer ${process.env.API_TOKEN}`,
   *   'X-API-Key': process.env.API_KEY
   * }
   * ```
   */
  headers?: Record<string, string>
}

interface CacheEntry {
  url: string
  fetchedAt: string // ISO timestamp
  introspectionResult: { data: IntrospectionSchema.IntrospectionQuery } // Validated GraphQL introspection result
}

const getCacheKey = (url: string): string => {
  return createHash('sha256').update(url).digest('hex')
}

const getCachePath = (url: string, projectRoot: string): string => {
  const cacheKey = getCacheKey(url)
  return Path.join(projectRoot, '.polen', 'cache', 'introspection', `${cacheKey}.json`)
}

const readCache = (cachePath: string): Effect.Effect<CacheEntry | null, PlatformError, FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem
    const exists = yield* fs.exists(cachePath)
    if (!exists) return null

    const content = yield* fs.readFileString(cachePath).pipe(
      Effect.catchAll(() => Effect.succeed(null)),
    )
    if (!content) return null

    try {
      const data = Json.codec.decode(content) as any
      // Validate the introspection result in the cache
      if (data && data.introspectionResult && data.introspectionResult.data) {
        const validated = IntrospectionSchema.decodeSync(data.introspectionResult.data)
        return {
          ...data,
          introspectionResult: { data: validated },
        } as CacheEntry
      }
      return null
    } catch {
      return null
    }
  })

const writeCache = (cachePath: string, entry: CacheEntry): Effect.Effect<void, Error, FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem
    const dir = Path.dirname(cachePath)
    yield* fs.makeDirectory(dir, { recursive: true })
    yield* fs.writeFileString(cachePath, Json.codec.encode(entry as any))
  })

const fetchIntrospection = (options: Options): Effect.Effect<Grafaid.Schema.Schema, Error, FileSystem> => {
  if (!options.url) {
    return Effect.fail(new Error('URL is required for introspection'))
  }
  return GraphqlSchemaLoader.load({
    type: `introspect`,
    url: options.url,
    headers: options.headers,
  })
}

const createCatalogFromSchema = (
  schemaData: Grafaid.Schema.Schema,
): Effect.Effect<Catalog.Unversioned.Unversioned, Error> =>
  Effect.gen(function*() {
    const date = new Date()
    const dateString = date.toISOString().split('T')[0]!
    const after = schemaData
    const before = Grafaid.Schema.empty
    const changes = yield* Change.calcChangeset({
      before,
      after,
    })

    const revision = Revision.make({
      date: DateOnly.make(dateString),
      changes,
    })

    // Create unversioned schema
    const schema = Schema.Unversioned.make({
      revisions: [revision],
      definition: after, // GraphQLSchema object
    })

    // Return catalog
    return Catalog.Unversioned.make({
      schema,
    })
  })

export const loader = InputSource.create({
  name: 'introspection',

  isApplicable: (options: Options) => {
    // This source is applicable if a URL is provided
    return Effect.succeed(!!options.url)
  },

  readIfApplicableOrThrow: (options: Options, config) =>
    Effect.gen(function*() {
      if (!options.url) return null

      const cachePath = getCachePath(options.url, config.paths.project.rootDir)

      // Try to read from cache
      const cacheEntry = yield* readCache(cachePath).pipe(
        Effect.mapError((error) =>
          new InputSource.InputSourceError({
            source: 'introspection',
            message: `Failed to read cache: ${error}`,
            cause: error,
          })
        ),
      )

      let schema: Grafaid.Schema.Schema

      if (cacheEntry && cacheEntry.url === options.url) {
        // Use cached introspection result
        // The cache contains { data: IntrospectionQuery } structure
        schema = Grafaid.Schema.fromIntrospectionQuery(cacheEntry.introspectionResult.data as any)
      } else {
        // Fetch fresh introspection
        schema = yield* fetchIntrospection(options).pipe(
          Effect.mapError((error) =>
            new InputSource.InputSourceError({
              source: 'introspection',
              message: `Failed to fetch introspection: ${error}`,
              cause: error,
            })
          ),
        )

        // Save to cache
        const introspectionQuery = Grafaid.Schema.toIntrospectionQuery(schema)
        const newCacheEntry: CacheEntry = {
          url: options.url,
          fetchedAt: new Date().toISOString(),
          introspectionResult: { data: introspectionQuery as IntrospectionSchema.IntrospectionQuery },
        }

        yield* writeCache(cachePath, newCacheEntry).pipe(
          Effect.mapError((error) =>
            new InputSource.InputSourceError({
              source: 'introspection',
              message: `Failed to write cache: ${error}`,
              cause: error,
            })
          ),
        )
      }

      return yield* createCatalogFromSchema(schema).pipe(
        Effect.mapError((error) =>
          new InputSource.InputSourceError({
            source: 'introspection',
            message: `Failed to create catalog: ${error}`,
            cause: error,
          })
        ),
      )
    }),

  reCreate: (options: Options, config) =>
    Effect.gen(function*() {
      if (!options.url) return null

      const cachePath = getCachePath(options.url, config.paths.project.rootDir)

      // Force fresh introspection
      const schema = yield* fetchIntrospection(options).pipe(
        Effect.mapError((error) =>
          new InputSource.InputSourceError({
            source: 'introspection',
            message: `Failed to fetch introspection: ${error}`,
            cause: error,
          })
        ),
      )

      // Update cache
      const __schema = Grafaid.Schema.toIntrospectionQuery(schema)
      const newCacheEntry: CacheEntry = {
        url: options.url,
        fetchedAt: new Date().toISOString(),
        introspectionResult: { data: { __schema } as any as IntrospectionSchema.IntrospectionQuery },
      }

      yield* writeCache(cachePath, newCacheEntry).pipe(
        Effect.mapError((error) =>
          new InputSource.InputSourceError({
            source: 'introspection',
            message: `Failed to write cache: ${error}`,
            cause: error,
          })
        ),
      )

      return yield* createCatalogFromSchema(schema).pipe(
        Effect.mapError((error) =>
          new InputSource.InputSourceError({
            source: 'introspection',
            message: `Failed to create catalog: ${error}`,
            cause: error,
          })
        ),
      )
    }),
})
