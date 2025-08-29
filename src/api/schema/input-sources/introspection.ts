import { InputSource } from '#api/schema/input-source/$'
import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { DateOnly } from '#lib/date-only/$'
import { Grafaid } from '#lib/grafaid'
import { GraphqlSchemaLoader } from '#lib/graphql-schema-loader'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'
import { FileSystem } from '@effect/platform/FileSystem'
import { Fs, Json, Path } from '@wollybeard/kit'
import { Effect } from 'effect'
import { createHash } from 'node:crypto'

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
  url: string
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
  introspectionResult: any // The GraphQL introspection result
}

const getCacheKey = (url: string): string => {
  return createHash('sha256').update(url).digest('hex')
}

const getCachePath = (url: string, projectRoot: string): string => {
  const cacheKey = getCacheKey(url)
  return Path.join(projectRoot, '.polen', 'cache', 'introspection', `${cacheKey}.json`)
}

const readCache = async (cachePath: string): Promise<CacheEntry | null> => {
  const content = await Fs.read(cachePath)
  if (!content) return null

  try {
    const data = Json.codec.decode(content)
    return data as unknown as CacheEntry
  } catch {
    return null
  }
}

const writeCache = async (cachePath: string, entry: CacheEntry): Promise<void> => {
  await Fs.write({
    path: cachePath,
    content: Json.codec.encode(entry as any),
  })
}

const fetchIntrospection = (options: Options): Effect.Effect<Grafaid.Schema.Schema, Error, FileSystem> =>
  GraphqlSchemaLoader.load({
    type: `introspect`,
    url: options.url,
    headers: options.headers,
  })

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

export const loader = InputSource.createEffect({
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
      const cacheEntry = yield* Effect.tryPromise({
        try: () => readCache(cachePath),
        catch: (error) => InputSource.InputSourceError('introspection', `Failed to read cache: ${error}`, error),
      })

      let schema: Grafaid.Schema.Schema

      if (cacheEntry && cacheEntry.url === options.url) {
        // Use cached introspection result
        schema = Grafaid.Schema.fromIntrospectionQuery(cacheEntry.introspectionResult)
      } else {
        // Fetch fresh introspection
        schema = yield* fetchIntrospection(options).pipe(
          Effect.mapError((error) =>
            InputSource.InputSourceError('introspection', `Failed to fetch introspection: ${error}`, error)
          ),
        )

        // Save to cache
        const __schema = Grafaid.Schema.toIntrospectionQuery(schema)
        const newCacheEntry: CacheEntry = {
          url: options.url,
          fetchedAt: new Date().toISOString(),
          introspectionResult: { data: { __schema } },
        }

        yield* Effect.tryPromise({
          try: () => writeCache(cachePath, newCacheEntry),
          catch: (error) => InputSource.InputSourceError('introspection', `Failed to write cache: ${error}`, error),
        })
      }

      return yield* createCatalogFromSchema(schema).pipe(
        Effect.mapError((error) =>
          InputSource.InputSourceError('introspection', `Failed to create catalog: ${error}`, error)
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
          InputSource.InputSourceError('introspection', `Failed to fetch introspection: ${error}`, error)
        ),
      )

      // Update cache
      const __schema = Grafaid.Schema.toIntrospectionQuery(schema)
      const newCacheEntry: CacheEntry = {
        url: options.url,
        fetchedAt: new Date().toISOString(),
        introspectionResult: { data: { __schema } },
      }

      yield* Effect.tryPromise({
        try: () => writeCache(cachePath, newCacheEntry),
        catch: (error) => InputSource.InputSourceError('introspection', `Failed to write cache: ${error}`, error),
      })

      return yield* createCatalogFromSchema(schema).pipe(
        Effect.mapError((error) =>
          InputSource.InputSourceError('introspection', `Failed to create catalog: ${error}`, error)
        ),
      )
    }),
})
