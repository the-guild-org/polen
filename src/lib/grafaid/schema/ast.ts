import { Effect } from 'effect'
import { type DocumentNode, Kind, parse as graphqlParse } from 'graphql'

// Effect-based version of parse
export const parse = (source: string): Effect.Effect<DocumentNode, Error> =>
  Effect.try({
    try: () => graphqlParse(source),
    catch: (error) => new Error(`Failed to parse GraphQL: ${error}`),
  })

export { type DocumentNode as Document } from 'graphql'

export const empty: DocumentNode = { definitions: [], kind: Kind.DOCUMENT }
