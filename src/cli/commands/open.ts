import { Api } from '#api/$'
import { Op } from '#dep/effect'
import { Ef } from '#dep/effect'
import { Vite } from '#dep/vite/index'
import { toViteUserConfig } from '#vite/config'
import { Command, Options } from '@effect/cli'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { FileSystem } from '@effect/platform/FileSystem'
import { Err, Fs, FsLoc, Json, Rec } from '@wollybeard/kit'
import { Grafaid, GraphqlSchemaLoader } from 'graphql-kit'
import { homedir } from 'node:os'
import { allowGlobalParameter } from '../_/parameters.js'

// Define introspection headers option
const introspectionHeaders = Options.text('introspection-headers').pipe(
  Options.withAlias('inh'),
  Options.optional,
  Options.withDescription(
    'Include headers in the introspection query request sent when using --introspection-url. Format is JSON Object.',
  ),
)

// Define mutually exclusive source options
const introspectUrl = Options.text('introspect').pipe(
  Options.withAlias('in'),
  Options.withAlias('i'),
  Options.optional,
  Options.withDescription('Get the schema by sending a GraphQL introspection query to this URL.'),
)

const sdlPath = Options.text('sdl').pipe(
  Options.withAlias('s'),
  Options.optional,
  Options.withDescription(
    'Get the schema from a GraphQL Schema Definition Language file. Can be a path to a local file or an HTTP URL to a remote one.',
  ),
)

const namedSchema = Options.choice('name', ['github', 'hive']).pipe(
  Options.withAlias('n'),
  Options.optional,
  Options.withDescription(
    'Pick from a well known public API. Polen already knows how to fetch the schema for these APIs.',
  ),
)

const cache = Options.boolean('cache').pipe(
  Options.withDefault(true),
  Options.withDescription('Enable or disable caching. By default this command caches fetched schemas for re-use.'),
)

// Cache implementation
const homeDirLoc = FsLoc.AbsDir.decodeSync(homedir())
const cachePathLoc = FsLoc.join(
  homeDirLoc,
  FsLoc.fromString('.polen/cache/cli/open'),
)
const cacheDir = FsLoc.encodeSync(cachePathLoc)

const base64Codec = {
  encode: (str: string) => Buffer.from(str).toString('base64'),
  decode: (str: string) => Buffer.from(str, 'base64').toString('utf-8'),
}

const cacheWrite = async (source: string, schema: Grafaid.Schema.Schema, useCache: boolean) => {
  if (!useCache) return

  await Err.tryCatchIgnore(async () => {
    const fileName = base64Codec.encode(source)
    const fileNameLoc = FsLoc.RelFile.decodeSync(fileName)
    const filePath = FsLoc.join(cachePathLoc, fileNameLoc)
    const sdl = Grafaid.Schema.print(schema)
    await Ef.runPromise(
      Ef.gen(function*() {
        // Ensure cache directory exists
        yield* Fs.write(cachePathLoc, { recursive: true })
        yield* Fs.write(filePath, sdl)
      }).pipe(Ef.provide(NodeFileSystem.layer)),
    )
  })
}

const cacheRead = async (source: string, useCache: boolean) => {
  if (!useCache) return null

  return Err.tryCatchIgnore(async () => {
    const fileName = base64Codec.encode(source)
    const fileNameLoc = FsLoc.RelFile.decodeSync(fileName)
    const filePath = FsLoc.join(cachePathLoc, fileNameLoc)
    const sdl = await Ef.runPromise(
      Ef.gen(function*() {
        const result = yield* Ef.either(Fs.readString(filePath))
        if (result._tag === 'Left') return null
        return result.right
      }).pipe(Ef.provide(NodeFileSystem.layer)),
    )
    if (!sdl) return null
    const documentNode = await Ef.runPromise(Grafaid.Parse.parseSchema(sdl, { source: FsLoc.encodeSync(filePath) }))
    return await Ef.runPromise(Grafaid.Schema.fromAST(documentNode))
  })
}

const wrapCache = (fn: typeof GraphqlSchemaLoader.load, useCache: boolean) => {
  const wrapped = (...args: Parameters<typeof GraphqlSchemaLoader.load>) =>
    Ef.gen(function*() {
      const cacheKey = JSON.stringify(args)
      const cachedSchema = yield* Ef.tryPromise({
        try: () => cacheRead(cacheKey, useCache),
        catch: (error) => new Error(`Failed to read cache: ${String(error)}`),
      })

      if (cachedSchema) {
        return cachedSchema
      }

      // GraphqlSchemaLoader.load returns Effect<GraphQLSchema, Error, FileSystem>
      const value = yield* fn(...args)

      yield* Ef.tryPromise({
        try: () => cacheWrite(cacheKey, value, useCache),
        catch: (error) => new Error(`Failed to write cache: ${String(error)}`),
      })

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
    Ef.gen(function*() {
      // Validate that exactly one source option is provided
      const introspectValue = Op.getOrUndefined(introspectUrl)
      const sdlValue = Op.getOrUndefined(sdlPath)
      const namedValue = Op.getOrUndefined(namedSchema)
      const headersValue = Op.getOrUndefined(introspectionHeaders)

      const sources = [introspectValue, sdlValue, namedValue].filter(Boolean)
      if (sources.length === 0) {
        return yield* Ef.fail(new Error('Must specify one of: --introspect, --sdl, or --name'))
      }
      if (sources.length > 1) {
        return yield* Ef.fail(new Error('Cannot specify multiple source options'))
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

      const tempDir = yield* Fs.makeTempDirectoryScoped()
      const tempDirStr = FsLoc.AbsDir.encodeSync(tempDir)
      const config = yield* Api.ConfigResolver.fromMemory({
        schema: {
          sources: {
            memory: {
              revisions: [
                {
                  date: new Date(),
                  value: schema,
                },
              ],
            },
          },
        },
      }, tempDirStr)

      const viteConfig = toViteUserConfig(config)
      const viteDevServer = yield* Ef.tryPromise({
        try: () => Vite.createServer(viteConfig),
        catch: (error) => new Error(`Failed to create Vite server: ${String(error)}`),
      })

      yield* Ef.tryPromise({
        try: () => viteDevServer.listen(),
        catch: (error) => new Error(`Failed to start dev server: ${String(error)}`),
      })
      viteDevServer.printUrls()
    }).pipe(Ef.provide(NodeFileSystem.layer)),
)
