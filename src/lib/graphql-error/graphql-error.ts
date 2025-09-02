import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema
// ============================================================================

/**
 * GraphQL source location information
 */
export const Location = S.Struct({
  line: S.Number,
  column: S.Number,
}).annotations({
  identifier: 'GraphQLLocation',
  description: 'Source location in a GraphQL document',
})

/**
 * GraphQL error structure
 */
export const GraphQLError = S.Struct({
  message: S.String,
  locations: S.optional(S.Array(Location)),
}).annotations({
  identifier: 'GraphQLError',
  description: 'GraphQL validation or execution error',
})

/**
 * Context for GraphQL validation errors
 */
export const ValidationContext = S.Struct({
  example: S.Struct({
    id: S.String,
    path: S.String,
  }),
  version: S.String,
  errors: S.Array(GraphQLError),
}).annotations({
  identifier: 'GraphQLValidationContext',
  description: 'Context for GraphQL validation errors against a schema version',
})

// ============================================================================
// Type exports
// ============================================================================

export type Location = S.Schema.Type<typeof Location>
export type GraphQLError = S.Schema.Type<typeof GraphQLError>
export type ValidationContext = S.Schema.Type<typeof ValidationContext>

// ============================================================================
// Constructors
// ============================================================================

export const make = GraphQLError.make
export const makeLocation = Location.make
export const makeValidationContext = ValidationContext.make

// ============================================================================
// Type guards
// ============================================================================

export const is = S.is(GraphQLError)
export const isLocation = S.is(Location)
export const isValidationContext = S.is(ValidationContext)

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decode(GraphQLError)
export const decodeSync = S.decodeSync(GraphQLError)
export const encode = S.encode(GraphQLError)
