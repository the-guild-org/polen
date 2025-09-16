/**
 * Type-level parser for GraphQL schema paths.
 *
 * Provides compile-time parsing and validation of GraphQL schema path strings.
 * This enables type-safe path construction with autocomplete and error detection.
 */

import type { Ts } from '@wollybeard/kit'

// ============================================================================
// Character Types
// ============================================================================

type Letter =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

type NameChar = Letter | Digit | '_'

// ============================================================================
// Name Parsing
// ============================================================================

type ParseName<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Letter | '_' ? ParseNameRest<Rest, First>
  : Ts.StaticError<'Name must start with letter or underscore', { received: S }>
  : Ts.StaticError<'Empty name', { received: S }>

type ParseNameRest<S extends string, Acc extends string> = S extends '' ? Acc
  : S extends `${infer First}${infer Rest}` ? First extends NameChar ? ParseNameRest<Rest, `${Acc}${First}`>
    : { name: Acc; rest: S }
  : { name: Acc; rest: S }

// ============================================================================
// Version Parsing
// ============================================================================

type ParseVersion<S extends string> = S extends `v${infer Rest}` ? ParseVersionNumber<Rest, 'v'>
  : { version: undefined; rest: S }

type ParseVersionNumber<S extends string, Acc extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Digit | '.' | ',' | '-' ? ParseVersionNumber<Rest, `${Acc}${First}`>
  : First extends ':' ? { version: Acc; rest: Rest }
  : Ts.StaticError<'Invalid version character', { received: First }>
  : { version: Acc; rest: '' }

// ============================================================================
// Path Segment Parsing
// ============================================================================

type ParseSegment<S extends string, Parent = unknown> = S extends '' ? Parent
  : S extends `.${infer Rest}` ? ParseField<Rest, Parent>
  : S extends `$${infer Rest}` ? ParseArgument<Rest, Parent>
  : S extends `@${infer Rest}` ? ParseDirective<Rest, Parent>
  : S extends `#${infer Rest}` ? ParseResolvedType<Rest, Parent>
  : Ts.StaticError<'Invalid path segment', { received: S }>

type ParseField<S extends string, Parent> = ParseName<S> extends { name: infer Name; rest: infer Rest }
  ? Rest extends string ? {
      _tag: 'GraphQLPathSegmentField'
      name: Name
      next: ParseSegment<Rest, { _tag: 'GraphQLPathSegmentField'; name: Name }>
    }
  : never
  : ParseName<S> extends string ? {
      _tag: 'GraphQLPathSegmentField'
      name: ParseName<S>
      next: undefined
    }
  : ParseName<S>

type ParseArgument<S extends string, Parent> = ParseName<S> extends { name: infer Name; rest: infer Rest }
  ? Rest extends string ? {
      _tag: 'GraphQLPathSegmentArgument'
      name: Name
      next: ParseSegment<Rest, { _tag: 'GraphQLPathSegmentArgument'; name: Name }>
    }
  : never
  : ParseName<S> extends string ? {
      _tag: 'GraphQLPathSegmentArgument'
      name: ParseName<S>
      next: undefined
    }
  : ParseName<S>

type ParseDirective<S extends string, Parent> = ParseName<S> extends { name: infer Name; rest: infer Rest }
  ? Rest extends string ? {
      _tag: 'GraphQLPathSegmentDirective'
      name: Name
      args: undefined
    }
  : never
  : ParseName<S> extends string ? {
      _tag: 'GraphQLPathSegmentDirective'
      name: ParseName<S>
      args: undefined
    }
  : ParseName<S>

type ParseResolvedType<S extends string, Parent> = S extends '' ? { _tag: 'GraphQLPathSegmentResolvedType' }
  : Ts.StaticError<'Resolved type must be at end of path', { received: S }>

// ============================================================================
// Type Path Parsing
// ============================================================================

type ParseTypePath<S extends string> = ParseName<S> extends { name: infer Name; rest: infer Rest }
  ? Rest extends string ? {
      _tag: 'GraphQLPathSegmentType'
      name: Name
      next: ParseSegment<Rest, { _tag: 'GraphQLPathSegmentType'; name: Name }>
    }
  : never
  : ParseName<S> extends string ? {
      _tag: 'GraphQLPathSegmentType'
      name: ParseName<S>
      next: undefined
    }
  : ParseName<S>

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse a GraphQL schema path string at the type level.
 * Returns the parsed AST or a static error.
 */
export type ParsePath<$String extends string> = $String extends '' ? Ts.StaticError<'Empty path', { received: $String }>
  : ParseVersion<$String> extends { version: infer Version; rest: infer Rest }
    ? Rest extends string
      ? Rest extends '' ? Ts.StaticError<'Path cannot be empty after version', { received: $String }>
      : {
        _tag: 'GraphQLPathRoot'
        version: Version
        next: ParseTypePath<Rest>
      }
    : never
  : {
    _tag: 'GraphQLPathRoot'
    version: undefined
    next: ParseTypePath<$String>
  }

// ============================================================================
// Validation Utilities
// ============================================================================

export type IsValidPath<$String extends string> = ParsePath<$String> extends { _tag: 'GraphQLPathRoot' } ? true
  : false

// ============================================================================
// Extraction Utilities
// ============================================================================

export type ExtractTypeName<$String extends string> = ParsePath<$String> extends { next: { name: infer $Name } } ? $Name
  : never

export type HasVersion<$String extends string> = ParsePath<$String> extends { version: undefined } ? false : true
