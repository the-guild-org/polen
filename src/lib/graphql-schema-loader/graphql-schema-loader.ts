import { Grafaid } from '#lib/grafaid'
import { Fs } from '@wollybeard/kit'
import { neverCase } from '@wollybeard/kit/language'
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

export const load = async (source: SchemaPointer): Promise<Grafaid.Schema.Schema> => {
  switch (source.type) {
    case `introspect`: {
      const graffle = Graffle
        .create()
        .use(Introspection())
        .transport({
          url: source.url,
          headers: source.headers || {},
        })

      const introspectionResult = await graffle.introspect()
      if (!introspectionResult) throw new Error(`Failed to introspect schema.`)

      return Grafaid.Schema.fromIntrospectionQuery(introspectionResult)
    }
    case `sdl`: {
      if (URL.canParse(source.pathOrUrl)) {
        const response = await fetch(source.pathOrUrl)

        if (!response.ok) {
          throw new Error(`Failed to download SDL from ${source.pathOrUrl}. Status: ${String(response.status)}`)
        }

        const sdlContent = await response.text()

        try {
          const ast = Grafaid.Schema.AST.parse(sdlContent)
          return Grafaid.Schema.fromAST(ast)
        } catch (error) {
          throw new Error(
            `Failed to parse SDL from ${source.pathOrUrl}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      } else {
        const sdlContent = await Fs.read(source.pathOrUrl)
        if (!sdlContent) throw new Error(`Failed to read SDL from ${source.pathOrUrl}.`)

        try {
          const ast = Grafaid.Schema.AST.parse(sdlContent)
          return Grafaid.Schema.fromAST(ast)
        } catch (error) {
          throw new Error(
            `Failed to parse SDL from ${source.pathOrUrl}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }
    }
    case `name`: {
      switch (source.name) {
        case `github`: {
          return load({ type: `sdl`, pathOrUrl: `https://docs.github.com/public/fpt/schema.docs.graphql` })
        }
        case `hive`: {
          return load({ type: `introspect`, url: `https://api.graphql-hive.com/graphql` })
        }
        default:
          return neverCase(source.name)
      }
    }
    default:
      return neverCase(source)
  }
}
