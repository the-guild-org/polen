import { S } from '#lib/kit-temp'
import * as Field from './field.js'
import * as Type from './type.js'

/**
 * The root GraphQL schema path structure.
 * Represents the starting point of a path traversal.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface Root {
  _tag: 'GraphQLPathRoot'
  version?: string | undefined
  next?: RootNext | undefined
}

export type RootNext = Type.Type

export interface RootEncoded {
  _tag: 'GraphQLPathRoot'
  version?: string | undefined
  next?: RootNextEncoded | undefined
}

export type RootNextEncoded = Type.TypeEncoded

// ============================================================================
// Schema
// ============================================================================

export const Schema = S.TaggedStruct('GraphQLPathRoot', {
  version: S.optional(S.String),
  next: S.optional(S.suspend((): S.Schema<RootNext, RootNextEncoded> => Type.Schema)),
})

// ============================================================================
// Constructors
// ============================================================================

export const make = Schema.make
