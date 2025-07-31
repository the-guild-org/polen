import { Grafaid } from '#lib/grafaid'
import { FileSystem } from '@effect/platform/FileSystem'
import { Fs } from '@wollybeard/kit'
import { neverCase } from '@wollybeard/kit/language'
import { Effect } from 'effect'
import { Graffle } from 'graffle'
import { Introspection } from 'graffle/extensions/introspection'

export type SchemaPointer = {
  type: `introspect`
  url: string
  headers?: Record<string, string> | undefined
} | {
  type: `sdl`
  pathOrUrl: string
} | {
  type: `name`
  name: `github` | `hive`
}

export const load = (source: SchemaPointer): Effect.Effect<Grafaid.Schema.Schema, Error, FileSystem> =>
  Effect.gen(function*() {
    switch (source.type) {
      case `introspect`: {
        const graffle = Graffle
          .create()
          .use(Introspection())
          .transport({
            url: source.url,
            headers: source.headers || {},
          })

        const introspectionResult = yield* Effect.tryPromise({
          try: () => graffle.introspect(),
          catch: (error) => new Error(`Failed to introspect schema: ${error}`),
        })

        if (!introspectionResult) {
          return yield* Effect.fail(new Error(`Failed to introspect schema.`))
        }

        return Grafaid.Schema.fromIntrospectionQuery(introspectionResult)
      }
      case `sdl`: {
        if (URL.canParse(source.pathOrUrl)) {
          const response = yield* Effect.tryPromise({
            try: () => fetch(source.pathOrUrl),
            catch: (error) => new Error(`Failed to fetch SDL from ${source.pathOrUrl}: ${error}`),
          })

          if (!response.ok) {
            return yield* Effect.fail(
              new Error(`Failed to download SDL from ${source.pathOrUrl}. Status: ${String(response.status)}`),
            )
          }

          const sdlContent = yield* Effect.tryPromise({
            try: () => response.text(),
            catch: (error) => new Error(`Failed to read response text: ${error}`),
          })

          const ast = yield* Grafaid.Schema.AST.parse(sdlContent).pipe(
            Effect.mapError((error) => new Error(`Failed to parse SDL from ${source.pathOrUrl}: ${error}`)),
          )
          return yield* Grafaid.Schema.fromAST(ast).pipe(
            Effect.mapError((error) => new Error(`Failed to build schema from ${source.pathOrUrl}: ${error}`)),
          )
        } else {
          const fs = yield* FileSystem
          const sdlContent = yield* fs.readFileString(source.pathOrUrl).pipe(
            Effect.mapError((error) => new Error(`Failed to read SDL from ${source.pathOrUrl}: ${error}`)),
          )

          const ast = yield* Grafaid.Schema.AST.parse(sdlContent).pipe(
            Effect.mapError((error) => new Error(`Failed to parse SDL from ${source.pathOrUrl}: ${error}`)),
          )
          return yield* Grafaid.Schema.fromAST(ast).pipe(
            Effect.mapError((error) => new Error(`Failed to build schema from ${source.pathOrUrl}: ${error}`)),
          )
        }
      }
      case `name`: {
        switch (source.name) {
          case `github`: {
            return yield* load({ type: `sdl`, pathOrUrl: `https://docs.github.com/public/fpt/schema.docs.graphql` })
          }
          case `hive`: {
            return yield* load({ type: `introspect`, url: `https://api.graphql-hive.com/graphql` })
          }
          default:
            return neverCase(source.name)
        }
      }
      default:
        return neverCase(source)
    }
  })
