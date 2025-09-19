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

export type DirectiveLocation = S.Schema.Type<typeof DirectiveLocation>

// ============================================================================
// Named Type References (specific for each context)
// ============================================================================

// For Object types that implement interfaces
export const InterfaceRef = S.Struct({
  kind: S.Literal('INTERFACE'),
  name: S.String,
})

export type InterfaceRef = S.Schema.Type<typeof InterfaceRef>

// For Interface/Union possible types and root operation types
export const ObjectRef = S.Struct({
  kind: S.Literal('OBJECT'),
  name: S.String,
})

export type ObjectRef = S.Schema.Type<typeof ObjectRef>

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

export type NamedOutputTypeRef = S.Schema.Type<typeof NamedOutputTypeRef>

// Named input types
export const NamedInputTypeRef = S.Struct({
  kind: S.Union(
    S.Literal('SCALAR'),
    S.Literal('ENUM'),
    S.Literal('INPUT_OBJECT'),
  ),
  name: S.String,
})

export type NamedInputTypeRef = S.Schema.Type<typeof NamedInputTypeRef>

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

export type InputValue = S.Schema.Type<typeof InputValue>

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

export type Field = S.Schema.Type<typeof Field>

// ============================================================================
// Enum Value
// ============================================================================

export const EnumValue = S.Struct({
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  isDeprecated: S.Boolean,
  deprecationReason: S.Union(S.String, S.Null),
})

export type EnumValue = S.Schema.Type<typeof EnumValue>

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

export type Directive = S.Schema.Type<typeof Directive>

// ============================================================================
// Introspection Types (discriminated union)
// ============================================================================

export const ScalarType = S.Struct({
  kind: S.Literal('SCALAR'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  specifiedByURL: S.optional(S.Union(S.String, S.Null)),
})

export type ScalarType = S.Schema.Type<typeof ScalarType>

export const ObjectType = S.Struct({
  kind: S.Literal('OBJECT'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  fields: S.Array(Field),
  interfaces: S.Array(InterfaceRef),
})

export type ObjectType = S.Schema.Type<typeof ObjectType>

export const InterfaceType = S.Struct({
  kind: S.Literal('INTERFACE'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  fields: S.Array(Field),
  interfaces: S.Array(InterfaceRef),
  possibleTypes: S.Array(ObjectRef),
})

export type InterfaceType = S.Schema.Type<typeof InterfaceType>

export const UnionType = S.Struct({
  kind: S.Literal('UNION'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  possibleTypes: S.Array(ObjectRef),
})

export type UnionType = S.Schema.Type<typeof UnionType>

export const EnumType = S.Struct({
  kind: S.Literal('ENUM'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  enumValues: S.Array(EnumValue),
})

export type EnumType = S.Schema.Type<typeof EnumType>

export const InputObjectType = S.Struct({
  kind: S.Literal('INPUT_OBJECT'),
  name: S.String,
  description: S.optional(S.Union(S.String, S.Null)),
  inputFields: S.Array(InputValue),
  isOneOf: S.Boolean,
})

export type InputObjectType = S.Schema.Type<typeof InputObjectType>

// Complete IntrospectionType union
export const IntrospectionType = S.Union(
  ScalarType,
  ObjectType,
  InterfaceType,
  UnionType,
  EnumType,
  InputObjectType,
)

export type IntrospectionType = S.Schema.Type<typeof IntrospectionType>

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

export type Schema = S.Schema.Type<typeof Schema>

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

export type IntrospectionQuery = S.Schema.Type<typeof IntrospectionQuery>

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
