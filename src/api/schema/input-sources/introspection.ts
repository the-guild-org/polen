import { InputSource } from '#api/schema/input-source/$'
import { createSingleRevisionCatalog, mapToInputSourceError } from '#api/schema/input-source/helpers'
import { Ef } from '#dep/effect'
import type { FileSystem } from '@effect/platform'
import { PlatformError } from '@effect/platform/Error'
import { Fs, FsLoc, Json } from '@wollybeard/kit'
import { Grafaid, GraphqlSchemaLoader } from 'graphql-kit'
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

const getCachePath = (url: string, projectRoot: FsLoc.AbsDir.AbsDir): FsLoc.AbsFile.AbsFile => {
  const cacheKey = getCacheKey(url)
  return FsLoc.join(
    projectRoot,
    FsLoc.RelFile.decodeSync(`.polen/cache/introspection/${cacheKey}.json`),
  )
}

const readCache = (
  cachePath: FsLoc.AbsFile.AbsFile,
): Ef.Effect<CacheEntry | null, PlatformError, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const exists = yield* Fs.exists(cachePath)
    if (!exists) return null

    const content = yield* Fs.readString(cachePath).pipe(
      Ef.catchAll(() => Ef.succeed(null)),
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

const writeCache = (
  cachePath: FsLoc.AbsFile.AbsFile,
  entry: CacheEntry,
): Ef.Effect<void, Error, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const dir = FsLoc.toDir(cachePath)
    yield* Fs.write(dir, { recursive: true })
    yield* Fs.write(cachePath, Json.codec.encode(entry as any))
  })

const fetchIntrospection = (options: Options): Ef.Effect<Grafaid.Schema.Schema, Error> => {
  if (!options.url) {
    return Ef.fail(new Error('URL is required for introspection'))
  }
  return GraphqlSchemaLoader.load({
    type: `introspect`,
    url: options.url,
    headers: options.headers,
  })
}


export const loader = InputSource.create({
  name: 'introspection',

  isApplicable: (options: Options) => {
    // This source is applicable if a URL is provided
    return Ef.succeed(!!options.url)
  },

  readIfApplicableOrThrow: (options: Options, config) =>
    Ef.gen(function*() {
      if (!options.url) return null

      const cachePath = getCachePath(options.url, config.paths.project.rootDir)

      // Try to read from cache
      const cacheEntry = yield* readCache(cachePath).pipe(
        Ef.mapError(mapToInputSourceError('introspection')),
      )

      let schema: Grafaid.Schema.Schema

      if (cacheEntry && cacheEntry.url === options.url) {
        // Use cached introspection result
        // The cache contains { data: IntrospectionQuery } structure
        schema = Grafaid.Schema.fromIntrospectionQuery(cacheEntry.introspectionResult.data as any)
      } else {
        // Fetch fresh introspection
        schema = yield* fetchIntrospection(options).pipe(
          Ef.mapError((error) =>
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
          Ef.mapError((error) =>
            new InputSource.InputSourceError({
              source: 'introspection',
              message: `Failed to write cache: ${error}`,
              cause: error,
            })
          ),
        )
      }

      return yield* createSingleRevisionCatalog(schema, 'introspection')
    }),

  reCreate: (options: Options, config) =>
    Ef.gen(function*() {
      if (!options.url) return null

      const cachePath = getCachePath(options.url, config.paths.project.rootDir)

      // Force fresh introspection
      const schema = yield* fetchIntrospection(options).pipe(
        Ef.mapError((error) =>
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
        Ef.mapError((error) =>
          new InputSource.InputSourceError({
            source: 'introspection',
            message: `Failed to write cache: ${error}`,
            cause: error,
          })
        ),
      )

      return yield* createSingleRevisionCatalog(schema, 'introspection')
    }),
})
