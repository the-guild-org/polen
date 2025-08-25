import { Command, Options } from '@effect/cli'
import { Effect, Option } from 'effect'
import { Api } from '#api/index'
import { allowGlobalParameter } from '../_/parameters.js'
import { Vite } from '#dep/vite/index'
import { Grafaid } from '#lib/grafaid'
import { GraphqlSchemaLoader } from '#lib/graphql-schema-loader'
import { toViteUserConfig } from '#vite/config'
import type { Fn } from '@wollybeard/kit'
import { Err, Fs, Json, Path, Rec } from '@wollybeard/kit'
import { homedir } from 'node:os'

// Define introspection headers option
const introspectionHeaders = Options.text('introspection-headers').pipe(
  Options.withAlias('inh'),
  Options.optional,
  Options.withDescription(
    'Include headers in the introspection query request sent when using --introspection-url. Format is JSON Object.'
  )
)

// Define mutually exclusive source options
const introspectUrl = Options.text('introspect').pipe(
  Options.withAlias('in'),
  Options.withAlias('i'),
  Options.optional,
  Options.withDescription('Get the schema by sending a GraphQL introspection query to this URL.')
)

const sdlPath = Options.text('sdl').pipe(
  Options.withAlias('s'),
  Options.optional,
  Options.withDescription(
    'Get the schema from a GraphQL Schema Definition Language file. Can be a path to a local file or an HTTP URL to a remote one.'
  )
)

const namedSchema = Options.choice('name', ['github', 'hive']).pipe(
  Options.withAlias('n'),
  Options.optional,
  Options.withDescription('Pick from a well known public API. Polen already knows how to fetch the schema for these APIs.')
)

const cache = Options.boolean('cache').pipe(
  Options.withDefault(true),
  Options.withDescription('Enable or disable caching. By default this command caches fetched schemas for re-use.')
)

// Cache implementation
const cacheDir = Path.join(homedir(), '.polen', 'cache', 'cli', 'open')

const base64Codec = {
  encode: (str: string) => Buffer.from(str).toString('base64'),
  decode: (str: string) => Buffer.from(str, 'base64').toString('utf-8'),
}

const cacheWrite = async (source: string, schema: Grafaid.Schema.Schema, useCache: boolean) => {
  if (!useCache) return

  await Err.tryCatchIgnore(async () => {
    const fileName = base64Codec.encode(source)
    const filePath = Path.join(cacheDir, fileName)
    const sdl = Grafaid.Schema.print(schema)
    await Fs.write({ path: filePath, content: sdl })
  })
}

const cacheRead = async (source: string, useCache: boolean) => {
  if (!useCache) return null

  return Err.tryCatchIgnore(async () => {
    const fileName = base64Codec.encode(source)
    const filePath = Path.join(cacheDir, fileName)
    const sdl = await Fs.read(filePath)
    if (!sdl) return null
    const documentNode = await Effect.runPromise(Grafaid.Schema.AST.parse(sdl))
    return await Effect.runPromise(Grafaid.Schema.fromAST(documentNode))
  })
}

const wrapCache = (fn: typeof GraphqlSchemaLoader.load, useCache: boolean) => {
  const wrapped = (...args: Parameters<typeof GraphqlSchemaLoader.load>) => 
    Effect.gen(function* () {
      const cacheKey = JSON.stringify(args)
      const cachedSchema = yield* Effect.promise(() => cacheRead(cacheKey, useCache))

      if (cachedSchema) {
        return cachedSchema
      }

      // GraphqlSchemaLoader.load returns Effect<GraphQLSchema, Error, FileSystem>
      const value = yield* fn(...args)

      yield* Effect.promise(() => cacheWrite(cacheKey, value, useCache))

      return value
    })

  return wrapped
}

const parseHeaders = (headersJsonEncoded: string): Record<string, string> => {
  const headersJson = Json.codec.decode(headersJsonEncoded)
  if (!Rec.is(headersJson)) {
    throw new Error('--introspection-headers must be a JSON object.')
  }
  return headersJson as any
}

export const open = Command.make(
  'open',
  {
    introspectionHeaders,
    introspectUrl,
    sdlPath,
    namedSchema,
    cache,
    allowGlobal: allowGlobalParameter,
  },
  ({ introspectionHeaders, introspectUrl, sdlPath, namedSchema, cache, allowGlobal }) =>
    Effect.gen(function* () {
      // Validate that exactly one source option is provided
      const introspectValue = Option.getOrUndefined(introspectUrl)
      const sdlValue = Option.getOrUndefined(sdlPath)
      const namedValue = Option.getOrUndefined(namedSchema)
      const headersValue = Option.getOrUndefined(introspectionHeaders)
      
      const sources = [introspectValue, sdlValue, namedValue].filter(Boolean)
      if (sources.length === 0) {
        return yield* Effect.fail(new Error('Must specify one of: --introspect, --sdl, or --name'))
      }
      if (sources.length > 1) {
        return yield* Effect.fail(new Error('Cannot specify multiple source options'))
      }

      // Determine source type and value
      let sourceConfig: any
      
      if (introspectValue) {
        sourceConfig = {
          type: 'introspect',
          url: introspectValue,
          headers: headersValue ? parseHeaders(headersValue) : undefined,
        }
      } else if (sdlValue) {
        sourceConfig = {
          type: 'sdl',
          pathOrUrl: sdlValue,
        }
      } else if (namedValue) {
        sourceConfig = {
          type: 'name',
          name: namedValue,
        }
      }

      const load = wrapCache(GraphqlSchemaLoader.load, cache)
      const schema = yield* load(sourceConfig)

      const tempDir = yield* Effect.promise(() => Fs.makeTemporaryDirectory())
      const config = yield* Effect.promise(() =>
        Api.ConfigResolver.fromMemory({
          schema: {
            sources: {
              memory: {
                versions: [
                  {
                    date: new Date(),
                    value: schema,
                  },
                ],
              },
            },
          },
        }, tempDir)
      )

      const viteConfig = toViteUserConfig(config)
      const viteDevServer = yield* Effect.promise(() => Vite.createServer(viteConfig))

      yield* Effect.promise(() => viteDevServer.listen())
      viteDevServer.printUrls()
    })
)