import { S } from '#lib/kit-temp/effect'
import { Example } from './example.js'

// ============================================================================
// Schema and Type
// ============================================================================

export const Catalog = S.Struct({
  examples: S.Array(Example),
}).annotations({
  identifier: 'ExamplesCatalog',
  description: 'A catalog of GraphQL examples',
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
