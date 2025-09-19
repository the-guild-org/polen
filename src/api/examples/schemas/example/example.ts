import { S } from '#dep/effect'
import { Order } from 'effect'
import { Document } from 'graphql-kit'

// ============================================================================
// Schema
// ============================================================================

/**
 * An Example represents a GraphQL query/mutation example with metadata.
 * The versioning complexity is handled by the Document type.
 */
export const Example = S.Struct({
  /**
   * The name/identifier of the example (e.g., "get-pokemon", "list-users")
   */
  name: S.String,

  /**
   * The file system path where this example was found.
   * Used for diagnostic reporting and error messages.
   */
  path: S.String,

  /**
   * The document content, which can be unversioned, versioned, or partially versioned.
   */
  document: Document.Document,

  /**
   * Optional description file for this example.
   * Points to a markdown/MDX file that describes the example.
   */
  description: S.optional(S.Struct({ path: S.String })),
}).annotations({
  identifier: 'Example',
  description: 'A GraphQL example that contains a document with optional versioning support',
})

// ============================================================================
// Types
// ============================================================================

export type Example = S.Schema.Type<typeof Example>

// ============================================================================
// Constructors
// ============================================================================

export const make = Example.make

// ============================================================================
// Ordering
// ============================================================================

export const order: Order.Order<Example> = Order.mapInput(
  Order.string,
  (example: Example) => example.name,
)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalent = S.equivalence(Example)

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Example)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Example)
export const decodeSync = S.decodeSync(Example)
export const encode = S.encode(Example)
