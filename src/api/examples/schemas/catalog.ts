import { S } from '#lib/kit-temp/effect'
import { Example } from './example/$.js'

// ============================================================================
// Schema and Type
// ============================================================================

export const Catalog = S.Struct({
  // @claude add JSdoc to this
  examples: S.Array(Example.Example),
  // @claude add JSdoc to this
  index: S.optional(S.String),
}).annotations({
  identifier: 'ExamplesCatalog',
  description: 'A catalog of GraphQL examples with optional index content',
})

export type Catalog = S.Schema.Type<typeof Catalog>

// ============================================================================
// Constructors
// ============================================================================

export const make = Catalog.make

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Catalog)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Catalog)
export const decodeSync = S.decodeSync(Catalog)
export const encode = S.encode(Catalog)
