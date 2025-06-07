/* eslint-disable */
// @ts-nocheck
/*
 * Examples
 *
 * polen open --introspect https://api.graphql-hive.com/graphql
 * polen open --introspect https://api.github.com/graphql --introspection-headers '{"Authorization": "Bearer $GITHUB_TOKEN"}'
 * polen open --sdl https://docs.github.com/public/fpt/schema.docs.graphql
 */

import { Api } from '#api/index'
import { Vite } from '#dep/vite/index'
import { Grafaid } from '#lib/grafaid/index'
import { GraphqlSchemaLoader } from '#lib/graphql-schema-loader/index'
import { Command } from '@molt/command'
import type { Fn } from '@wollybeard/kit'
import { Err, Fs, Json, Path, Rec } from '@wollybeard/kit'
import { homedir } from 'node:os'
import { z } from 'zod'

const args = Command.create()
  .parameter(
    `--introspection-headers --inh`,
    z
      .string()
      .optional()
      .describe(
        `Include headers in the introspection query request sent when using --introspection-url. Format is JSON Object.`,
      ),
  )
  .parametersExclusive(`source`, ($) =>
    $.parameter(`--introspect --in -i`, {
      schema: z
        .string()
        .url()
        .describe(
          `Get the schema by sending a GraphQL introspection query to this URL.`,
        ),
    })
      .parameter(`--sdl -s`, {
        schema: z
          .string()
          .describe(
            `Get the schema from a GraphQL Schema Definition Language file. Can be a path to a local file or an HTTP URL to a remote one.`,
          ),
      })
      .parameter(`--name -n`, {
        schema: z
          .enum([`github`, `hive`])
          .describe(
            `Pick from a well known public API. Polen already knows how to fetch the schema for these APIs.`,
          ),
      }))
  .parameter(
    `--cache`,
    z
      .boolean()
      .default(true)
      .describe(
        `Enable or disable caching. By default this command caches fetched schemas for re-use.`,
      ),
  )
  .settings({
    parameters: {
      environment: {
        $default: {
          // todo prfix seting doesn't seem to work with Molt!
          prefix: `POLEN_CREATE_`,
          enabled: false,
        },
      },
    },
  })
  .parse()

// cache

const cacheDir = Path.join(homedir(), `.polen`, `cache`, `cli`, `open`)

const bsae64Codec = {
  encode: (str: string) => Buffer.from(str).toString(`base64`),
  decode: (str: string) => Buffer.from(str, `base64`).toString(`utf-8`),
}

const cacheWrite = async (source: string, schema: Grafaid.Schema.Schema) => {
  if (!args.cache) return

  await Err.tryCatchIgnore(async () => {
    const fileName = bsae64Codec.encode(source)
    const filePath = Path.join(cacheDir, fileName)
    const sdl = Grafaid.Schema.print(schema)
    await Fs.write({ path: filePath, content: sdl })
  })
}

const cacheRead = async (source: string) => {
  if (!args.cache) return null

  return Err.tryCatchIgnore(async () => {
    const fileName = bsae64Codec.encode(source)
    const filePath = Path.join(cacheDir, fileName)
    const sdl = await Fs.read(filePath)
    if (!sdl) return null
    return Grafaid.Schema.fromAST(Grafaid.Schema.AST.parse(sdl))
  })
}

const cache = {
  read: cacheRead,
  write: cacheWrite,
}

const wrapCache = <fn extends Fn.AnyAnyAsync>(fn: fn): fn => {
  const wrapped = async (...args: Parameters<fn>) => {
    const cacheKey = JSON.stringify(args)
    const cachedSchema = await cache.read(cacheKey)

    if (cachedSchema) {
      return cachedSchema
    }

    const value = await fn(...args)

    await cache.write(cacheKey, value)

    return value
  }

  return wrapped as any
}

// cache end

// todo: use a proper validation, e.g. zod, better yet: allow to specify the validation in molt itself
const parseHeaders = (headersJsonEncoded: string): Record<string, string> => {
  const headersJson = Json.codec.deserialize(headersJsonEncoded)
  if (!Rec.is(headersJson)) {
    console.log(`--introspection-headers must be a JSON object.`)
    process.exit(1)
  }
  return headersJson as any
}

const load = wrapCache(GraphqlSchemaLoader.load)
const schema = await load(
  args.source._tag === `name`
    ? { type: `name`, name: args.source.value }
    : args.source._tag === `sdl`
    ? { type: `sdl`, pathOrUrl: args.source.value }
    : {
      type: `introspect`,
      url: args.source.value,
      headers: args.introspectionHeaders
        ? parseHeaders(args.introspectionHeaders)
        : undefined,
    },
)

const config = await Api.ConfigResolver.fromMemory({
  root: await Fs.makeTemporaryDirectory(),
  schema: {
    dataSources: {
      data: {
        versions: [
          {
            before: Grafaid.Schema.empty,
            after: schema,
            changes: [],
            date: new Date(),
          },
        ],
      },
    },
  },
})

const viteDevServer = await Vite.createServer(config)

await viteDevServer.listen()

viteDevServer.printUrls()
