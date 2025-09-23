import { ParseResult, S } from '#dep/effect'

// ============================================================================
// Directive Locations (from GraphQL spec)
// ============================================================================

export const DirectiveLocation = S.Literal(
  'QUERY',
  'MUTATION',
  'SUBSCRIPTION',
  'FIELD',
  'FRAGMENT_DEFINITION',
  'FRAGMENT_SPREAD',
  'INLINE_FRAGMENT',
  'VARIABLE_DEFINITION',
  'SCHEMA',
  'SCALAR',
  'OBJECT',
  'FIELD_DEFINITION',
  'ARGUMENT_DEFINITION',
  'INTERFACE',
  'UNION',
  'ENUM',
  'ENUM_VALUE',
  'INPUT_OBJECT',
  'INPUT_FIELD_DEFINITION',
)

export type DirectiveLocation = typeof DirectiveLocation.Type

// ============================================================================
// Named Type References (specific for each context)
// ============================================================================

// For Object types that implement interfaces
export const InterfaceRef = S.Struct({
  kind: S.Literal('INTERFACE'),
  name: S.String,
})

export type InterfaceRef = typeof InterfaceRef.Type

// For Interface/Union possible types and root operation types
export const ObjectRef = S.Struct({
  kind: S.Literal('OBJECT'),
  name: S.String,
})

export type ObjectRef = typeof ObjectRef.Type

// ============================================================================
// Type References (recursive structures for wrapping types)
// ============================================================================

// Named output types
export const NamedOutputTypeRef = S.Struct({
  kind: S.Union(
    S.Literal('SCALAR'),
    S.Literal('OBJECT'),
    S.Literal('INTERFACE'),
    S.Literal('UNION'),
    S.Literal('ENUM'),
  ),
  name: S.String,
})

export type NamedOutputTypeRef = typeof NamedOutputTypeRef.Type

// Named input types
export const NamedInputTypeRef = S.Struct({
  kind: S.Union(
    S.Literal('SCALAR'),
    S.Literal('ENUM'),
    S.Literal('INPUT_OBJECT'),
  ),
  name: S.String,
})

export type NamedInputTypeRef = typeof NamedInputTypeRef.Type

// List wrapper for output types
export const ListOutputTypeRef = S.Struct({
  kind: S.Literal('LIST'),
  ofType: S.suspend((): S.Schema<OutputTypeRef> => OutputTypeRef),
})

export type ListOutputTypeRef = {
  readonly kind: 'LIST'
  readonly ofType: OutputTypeRef
}

// List wrapper for input types
export const ListInputTypeRef = S.Struct({
  kind: S.Literal('LIST'),
  ofType: S.suspend((): S.Schema<InputTypeRef> => InputTypeRef),
})

export type ListInputTypeRef = {
  readonly kind: 'LIST'
  readonly ofType: InputTypeRef
}

// NonNull wrapper for output types
export const NonNullOutputTypeRef = S.Struct({
  kind: S.Literal('NON_NULL'),
  ofType: S.Union(
    NamedOutputTypeRef,
    ListOutputTypeRef,
  ),
})

export type NonNullOutputTypeRef = {
  readonly kind: 'NON_NULL'
  readonly ofType: NamedOutputTypeRef | ListOutputTypeRef
}

// NonNull wrapper for input types
export const NonNullInputTypeRef = S.Struct({
  kind: S.Literal('NON_NULL'),
  ofType: S.Union(
    NamedInputTypeRef,
    ListInputTypeRef,
  ),
})

export type NonNullInputTypeRef = {
  readonly kind: 'NON_NULL'
  readonly ofType: NamedInputTypeRef | ListInputTypeRef
}

// Complete output type reference
export const OutputTypeRef = S.Union(
  NamedOutputTypeRef,
  ListOutputTypeRef,
  NonNullOutputTypeRef,
)

export type OutputTypeRef =
  | NamedOutputTypeRef
  | ListOutputTypeRef
  | NonNullOutputTypeRef

// Complete input type reference
export const InputTypeRef = S.Union(
  NamedInputTypeRef,
  ListInputTypeRef,
  NonNullInputTypeRef,
)

export type InputTypeRef =
  | NamedInputTypeRef
  | ListInputTypeRef
  | NonNullInputTypeRef

// ============================================================================
// Input Value (for arguments and input fields)
// ============================================================================

export const InputValue = S.Struct({
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  type: InputTypeRef,
  defaultValue: S.Union(S.String, S.Null),
  isDeprecated: S.optionalWith(S.Boolean, { exact: true }),
  deprecationReason: S.optional(S.Union(S.String, S.Null)),
})

export type InputValue = typeof InputValue.Type

// ============================================================================
// Field (for object and interface fields)
// ============================================================================

export const Field = S.Struct({
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  args: S.Array(InputValue),
  type: OutputTypeRef,
  isDeprecated: S.Boolean,
  deprecationReason: S.Union(S.String, S.Null),
})

export type Field = typeof Field.Type

// ============================================================================
// Enum Value
// ============================================================================

export const EnumValue = S.Struct({
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  isDeprecated: S.Boolean,
  deprecationReason: S.Union(S.String, S.Null),
})

export type EnumValue = typeof EnumValue.Type

// ============================================================================
// Directive
// ============================================================================

export const Directive = S.Struct({
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  isRepeatable: S.optionalWith(S.Boolean, { exact: true }),
  locations: S.Array(DirectiveLocation),
  args: S.Array(InputValue),
})

export type Directive = typeof Directive.Type

// ============================================================================
// Introspection Types (discriminated union)
// ============================================================================

export const ScalarType = S.Struct({
  kind: S.Literal('SCALAR'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  specifiedByURL: S.optional(S.Union(S.String, S.Null)),
})

export type ScalarType = typeof ScalarType.Type

export const ObjectType = S.Struct({
  kind: S.Literal('OBJECT'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  fields: S.Array(Field),
  interfaces: S.Array(InterfaceRef),
})

export type ObjectType = typeof ObjectType.Type

export const InterfaceType = S.Struct({
  kind: S.Literal('INTERFACE'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  fields: S.Array(Field),
  interfaces: S.Array(InterfaceRef),
  possibleTypes: S.Array(ObjectRef),
})

export type InterfaceType = typeof InterfaceType.Type

export const UnionType = S.Struct({
  kind: S.Literal('UNION'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  possibleTypes: S.Array(ObjectRef),
})

export type UnionType = typeof UnionType.Type

export const EnumType = S.Struct({
  kind: S.Literal('ENUM'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  enumValues: S.Array(EnumValue),
})

export type EnumType = typeof EnumType.Type

export const InputObjectType = S.Struct({
  kind: S.Literal('INPUT_OBJECT'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  inputFields: S.Array(InputValue),
  isOneOf: S.Boolean,
})

export type InputObjectType = typeof InputObjectType.Type

// Complete IntrospectionType union
export const IntrospectionType = S.Union(
  ScalarType,
  ObjectType,
  InterfaceType,
  UnionType,
  EnumType,
  InputObjectType,
)

export type IntrospectionType = typeof IntrospectionType.Type

// ============================================================================
// Schema
// ============================================================================

export const Schema = S.Struct({
  description: S.optional(S.Union(S.String, S.Null)),
  queryType: ObjectRef,
  mutationType: S.Union(ObjectRef, S.Null),
  subscriptionType: S.Union(ObjectRef, S.Null),
  types: S.Array(IntrospectionType),
  directives: S.Array(Directive),
})

export type Schema = typeof Schema.Type

// ============================================================================
// IntrospectionQuery
// ============================================================================

/**
 * The complete introspection query result structure as defined by GraphQL spec.
 * This is what you get when you query `{ __schema { ... } }`.
 */
export const IntrospectionQuery = S.Struct({
  __schema: Schema,
})

export type IntrospectionQuery = typeof IntrospectionQuery.Type

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(IntrospectionQuery)
export const decodeSync = S.decodeSync(IntrospectionQuery)
export const encode = S.encode(IntrospectionQuery)

// ============================================================================
// Error Handling
// ============================================================================

export const isParseError = ParseResult.isParseError
export const formatError = (error: ParseResult.ParseError) => ParseResult.TreeFormatter.formatError(error)
