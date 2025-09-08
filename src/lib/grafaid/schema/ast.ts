import { type DocumentNode, Kind } from 'graphql'

export { type DocumentNode as Document } from 'graphql'

export const empty: DocumentNode = { definitions: [], kind: Kind.DOCUMENT }
