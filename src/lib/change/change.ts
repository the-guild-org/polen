import { S } from '#lib/kit-temp/effect'
import * as Criticality from './criticality.js'

// ============================================================================
// Base Change Schema
// ============================================================================

const ChangeBase = S.Struct({
  message: S.String,
  path: S.optional(S.String),
  criticality: Criticality.Criticality,
})

// ============================================================================
// Type Changes
// ============================================================================

export const TypeAdded = S.TaggedStruct('TYPE_ADDED', {
  ...ChangeBase.fields,
  name: S.String,
})

export const TypeRemoved = S.TaggedStruct('TYPE_REMOVED', {
  ...ChangeBase.fields,
  name: S.String,
})

export const TypeKindChanged = S.TaggedStruct('TYPE_KIND_CHANGED', {
  ...ChangeBase.fields,
  name: S.String,
  oldKind: S.String,
  newKind: S.String,
})

export const TypeDescriptionChanged = S.TaggedStruct('TYPE_DESCRIPTION_CHANGED', {
  ...ChangeBase.fields,
  name: S.String,
  oldDescription: S.optional(S.String),
  newDescription: S.optional(S.String),
})

export const TypeDescriptionAdded = S.TaggedStruct('TYPE_DESCRIPTION_ADDED', {
  ...ChangeBase.fields,
  name: S.String,
  description: S.String,
})

export const TypeDescriptionRemoved = S.TaggedStruct('TYPE_DESCRIPTION_REMOVED', {
  ...ChangeBase.fields,
  name: S.String,
})

// ============================================================================
// Field Changes
// ============================================================================

export const FieldAdded = S.TaggedStruct('FIELD_ADDED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  isDeprecated: S.Boolean,
  isSafe: S.Boolean,
})

export const FieldRemoved = S.TaggedStruct('FIELD_REMOVED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
})

export const FieldTypeChanged = S.TaggedStruct('FIELD_TYPE_CHANGED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  oldType: S.String,
  newType: S.String,
  isSafe: S.Boolean,
})

export const FieldDeprecationAdded = S.TaggedStruct('FIELD_DEPRECATION_ADDED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  reason: S.optional(S.String),
})

export const FieldDeprecationRemoved = S.TaggedStruct('FIELD_DEPRECATION_REMOVED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
})

export const FieldDeprecationReasonChanged = S.TaggedStruct('FIELD_DEPRECATION_REASON_CHANGED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  oldReason: S.optional(S.String),
  newReason: S.optional(S.String),
})

export const FieldDeprecationReasonAdded = S.TaggedStruct('FIELD_DEPRECATION_REASON_ADDED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  reason: S.String,
})

export const FieldDeprecationReasonRemoved = S.TaggedStruct('FIELD_DEPRECATION_REASON_REMOVED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
})

export const FieldDescriptionChanged = S.TaggedStruct('FIELD_DESCRIPTION_CHANGED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  oldDescription: S.optional(S.String),
  newDescription: S.optional(S.String),
})

export const FieldDescriptionAdded = S.TaggedStruct('FIELD_DESCRIPTION_ADDED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  description: S.String,
})

export const FieldDescriptionRemoved = S.TaggedStruct('FIELD_DESCRIPTION_REMOVED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
})

// ============================================================================
// Field Argument Changes
// ============================================================================

export const FieldArgumentAdded = S.TaggedStruct('FIELD_ARGUMENT_ADDED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  argumentName: S.String,
  type: S.String,
  defaultValue: S.optional(S.Unknown),
})

export const FieldArgumentRemoved = S.TaggedStruct('FIELD_ARGUMENT_REMOVED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  argumentName: S.String,
})

export const FieldArgumentTypeChanged = S.TaggedStruct('FIELD_ARGUMENT_TYPE_CHANGED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  argumentName: S.String,
  oldType: S.String,
  newType: S.String,
})

export const FieldArgumentDescriptionChanged = S.TaggedStruct('FIELD_ARGUMENT_DESCRIPTION_CHANGED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  argumentName: S.String,
  oldDescription: S.optional(S.String),
  newDescription: S.optional(S.String),
})

export const FieldArgumentDefaultChanged = S.TaggedStruct('FIELD_ARGUMENT_DEFAULT_CHANGED', {
  ...ChangeBase.fields,
  typeName: S.String,
  fieldName: S.String,
  argumentName: S.String,
  oldDefault: S.optional(S.Unknown),
  newDefault: S.optional(S.Unknown),
})

// ============================================================================
// Enum Changes
// ============================================================================

export const EnumValueAdded = S.TaggedStruct('ENUM_VALUE_ADDED', {
  ...ChangeBase.fields,
  enumName: S.String,
  value: S.String,
  isDeprecated: S.Boolean,
})

export const EnumValueRemoved = S.TaggedStruct('ENUM_VALUE_REMOVED', {
  ...ChangeBase.fields,
  enumName: S.String,
  value: S.String,
})

export const EnumValueDescriptionChanged = S.TaggedStruct('ENUM_VALUE_DESCRIPTION_CHANGED', {
  ...ChangeBase.fields,
  enumName: S.String,
  value: S.String,
  oldDescription: S.optional(S.String),
  newDescription: S.optional(S.String),
})

export const EnumValueDeprecationAdded = S.TaggedStruct('ENUM_VALUE_DEPRECATION_ADDED', {
  ...ChangeBase.fields,
  enumName: S.String,
  value: S.String,
  reason: S.optional(S.String),
})

export const EnumValueDeprecationRemoved = S.TaggedStruct('ENUM_VALUE_DEPRECATION_REMOVED', {
  ...ChangeBase.fields,
  enumName: S.String,
  value: S.String,
})

export const EnumValueDeprecationReasonChanged = S.TaggedStruct('ENUM_VALUE_DEPRECATION_REASON_CHANGED', {
  ...ChangeBase.fields,
  enumName: S.String,
  value: S.String,
  oldReason: S.optional(S.String),
  newReason: S.optional(S.String),
})

export const EnumValueDeprecationReasonAdded = S.TaggedStruct('ENUM_VALUE_DEPRECATION_REASON_ADDED', {
  ...ChangeBase.fields,
  enumName: S.String,
  value: S.String,
  reason: S.String,
})

export const EnumValueDeprecationReasonRemoved = S.TaggedStruct('ENUM_VALUE_DEPRECATION_REASON_REMOVED', {
  ...ChangeBase.fields,
  enumName: S.String,
  value: S.String,
})

// ============================================================================
// Input Field Changes
// ============================================================================

export const InputFieldAdded = S.TaggedStruct('INPUT_FIELD_ADDED', {
  ...ChangeBase.fields,
  inputName: S.String,
  fieldName: S.String,
  isNullable: S.Boolean,
})

export const InputFieldRemoved = S.TaggedStruct('INPUT_FIELD_REMOVED', {
  ...ChangeBase.fields,
  inputName: S.String,
  fieldName: S.String,
})

export const InputFieldTypeChanged = S.TaggedStruct('INPUT_FIELD_TYPE_CHANGED', {
  ...ChangeBase.fields,
  inputName: S.String,
  fieldName: S.String,
  oldType: S.String,
  newType: S.String,
})

export const InputFieldDescriptionAdded = S.TaggedStruct('INPUT_FIELD_DESCRIPTION_ADDED', {
  ...ChangeBase.fields,
  inputName: S.String,
  fieldName: S.String,
  description: S.String,
})

export const InputFieldDescriptionRemoved = S.TaggedStruct('INPUT_FIELD_DESCRIPTION_REMOVED', {
  ...ChangeBase.fields,
  inputName: S.String,
  fieldName: S.String,
})

export const InputFieldDescriptionChanged = S.TaggedStruct('INPUT_FIELD_DESCRIPTION_CHANGED', {
  ...ChangeBase.fields,
  inputName: S.String,
  fieldName: S.String,
  oldDescription: S.optional(S.String),
  newDescription: S.optional(S.String),
})

export const InputFieldDefaultValueChanged = S.TaggedStruct('INPUT_FIELD_DEFAULT_VALUE_CHANGED', {
  ...ChangeBase.fields,
  inputName: S.String,
  fieldName: S.String,
  oldDefault: S.optional(S.Unknown),
  newDefault: S.optional(S.Unknown),
})

// ============================================================================
// Union Changes
// ============================================================================

export const UnionMemberAdded = S.TaggedStruct('UNION_MEMBER_ADDED', {
  ...ChangeBase.fields,
  unionName: S.String,
  memberName: S.String,
})

export const UnionMemberRemoved = S.TaggedStruct('UNION_MEMBER_REMOVED', {
  ...ChangeBase.fields,
  unionName: S.String,
  memberName: S.String,
})

// ============================================================================
// Interface Changes
// ============================================================================

export const ObjectTypeInterfaceAdded = S.TaggedStruct('OBJECT_TYPE_INTERFACE_ADDED', {
  ...ChangeBase.fields,
  objectName: S.String,
  interfaceName: S.String,
})

export const ObjectTypeInterfaceRemoved = S.TaggedStruct('OBJECT_TYPE_INTERFACE_REMOVED', {
  ...ChangeBase.fields,
  objectName: S.String,
  interfaceName: S.String,
})

// ============================================================================
// Directive Changes
// ============================================================================

export const DirectiveAdded = S.TaggedStruct('DIRECTIVE_ADDED', {
  ...ChangeBase.fields,
  name: S.String,
  locations: S.Array(S.String),
})

export const DirectiveRemoved = S.TaggedStruct('DIRECTIVE_REMOVED', {
  ...ChangeBase.fields,
  name: S.String,
})

export const DirectiveDescriptionChanged = S.TaggedStruct('DIRECTIVE_DESCRIPTION_CHANGED', {
  ...ChangeBase.fields,
  name: S.String,
  oldDescription: S.optional(S.String),
  newDescription: S.optional(S.String),
})

export const DirectiveLocationAdded = S.TaggedStruct('DIRECTIVE_LOCATION_ADDED', {
  ...ChangeBase.fields,
  name: S.String,
  location: S.String,
})

export const DirectiveLocationRemoved = S.TaggedStruct('DIRECTIVE_LOCATION_REMOVED', {
  ...ChangeBase.fields,
  name: S.String,
  location: S.String,
})

export const DirectiveArgumentAdded = S.TaggedStruct('DIRECTIVE_ARGUMENT_ADDED', {
  ...ChangeBase.fields,
  directiveName: S.String,
  argumentName: S.String,
  type: S.String,
})

export const DirectiveArgumentRemoved = S.TaggedStruct('DIRECTIVE_ARGUMENT_REMOVED', {
  ...ChangeBase.fields,
  directiveName: S.String,
  argumentName: S.String,
})

export const DirectiveArgumentDescriptionChanged = S.TaggedStruct('DIRECTIVE_ARGUMENT_DESCRIPTION_CHANGED', {
  ...ChangeBase.fields,
  directiveName: S.String,
  argumentName: S.String,
  oldDescription: S.optional(S.String),
  newDescription: S.optional(S.String),
})

export const DirectiveArgumentDefaultValueChanged = S.TaggedStruct('DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED', {
  ...ChangeBase.fields,
  directiveName: S.String,
  argumentName: S.String,
  oldDefault: S.optional(S.Unknown),
  newDefault: S.optional(S.Unknown),
})

export const DirectiveArgumentTypeChanged = S.TaggedStruct('DIRECTIVE_ARGUMENT_TYPE_CHANGED', {
  ...ChangeBase.fields,
  directiveName: S.String,
  argumentName: S.String,
  oldType: S.String,
  newType: S.String,
})

// ============================================================================
// Schema Changes
// ============================================================================

export const SchemaQueryTypeChanged = S.TaggedStruct('SCHEMA_QUERY_TYPE_CHANGED', {
  ...ChangeBase.fields,
  oldType: S.optional(S.String),
  newType: S.optional(S.String),
})

export const SchemaMutationTypeChanged = S.TaggedStruct('SCHEMA_MUTATION_TYPE_CHANGED', {
  ...ChangeBase.fields,
  oldType: S.optional(S.String),
  newType: S.optional(S.String),
})

export const SchemaSubscriptionTypeChanged = S.TaggedStruct('SCHEMA_SUBSCRIPTION_TYPE_CHANGED', {
  ...ChangeBase.fields,
  oldType: S.optional(S.String),
  newType: S.optional(S.String),
})

// ============================================================================
// Schema
// ============================================================================

export const Change = S.Union(
  // Type changes
  TypeAdded,
  TypeRemoved,
  TypeKindChanged,
  TypeDescriptionChanged,
  TypeDescriptionAdded,
  TypeDescriptionRemoved,
  // Field changes
  FieldAdded,
  FieldRemoved,
  FieldTypeChanged,
  FieldDeprecationAdded,
  FieldDeprecationRemoved,
  FieldDeprecationReasonChanged,
  FieldDeprecationReasonAdded,
  FieldDeprecationReasonRemoved,
  FieldDescriptionChanged,
  FieldDescriptionAdded,
  FieldDescriptionRemoved,
  // Field argument changes
  FieldArgumentAdded,
  FieldArgumentRemoved,
  FieldArgumentTypeChanged,
  FieldArgumentDescriptionChanged,
  FieldArgumentDefaultChanged,
  // Enum changes
  EnumValueAdded,
  EnumValueRemoved,
  EnumValueDescriptionChanged,
  EnumValueDeprecationAdded,
  EnumValueDeprecationRemoved,
  EnumValueDeprecationReasonChanged,
  EnumValueDeprecationReasonAdded,
  EnumValueDeprecationReasonRemoved,
  // Input field changes
  InputFieldAdded,
  InputFieldRemoved,
  InputFieldTypeChanged,
  InputFieldDescriptionAdded,
  InputFieldDescriptionRemoved,
  InputFieldDescriptionChanged,
  InputFieldDefaultValueChanged,
  // Union changes
  UnionMemberAdded,
  UnionMemberRemoved,
  // Interface changes
  ObjectTypeInterfaceAdded,
  ObjectTypeInterfaceRemoved,
  // Directive changes
  DirectiveAdded,
  DirectiveRemoved,
  DirectiveDescriptionChanged,
  DirectiveLocationAdded,
  DirectiveLocationRemoved,
  DirectiveArgumentAdded,
  DirectiveArgumentRemoved,
  DirectiveArgumentDescriptionChanged,
  DirectiveArgumentDefaultValueChanged,
  DirectiveArgumentTypeChanged,
  // Schema changes
  SchemaQueryTypeChanged,
  SchemaMutationTypeChanged,
  SchemaSubscriptionTypeChanged,
).annotations({
  identifier: 'Change',
  title: 'Schema Change',
  description: 'A change detected between two schemas',
})

export type Change = S.Schema.Type<typeof Change>

// ============================================================================
// Constructors
// ============================================================================

// Note: S.Union doesn't have a make property, so we don't export a generic make function
// Use the specific constructors for each change type instead

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Change)

// Type-specific guards
export const isTypeAdded = S.is(TypeAdded)
export const isTypeRemoved = S.is(TypeRemoved)
export const isFieldAdded = S.is(FieldAdded)
export const isFieldRemoved = S.is(FieldRemoved)

// Criticality guards
export const isBreaking = (change: Change): boolean => Criticality.isBreaking(change.criticality)

export const isDangerous = (change: Change): boolean => Criticality.isDangerous(change.criticality)

export const isSafe = (change: Change): boolean => Criticality.isSafe(change.criticality)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Change)
export const encode = S.encode(Change)

// ============================================================================
// Pattern Matching
// ============================================================================

/**
 * Pattern match on all change types with a default handler
 */
export const match = <$A>(change: Change) => ({
  with: <Tag extends Change['_tag']>(
    tag: Tag,
    handler: (change: Extract<Change, { _tag: Tag }>) => $A,
  ): $A | { with: any; otherwise: (defaultHandler: (change: Change) => $A) => $A } => {
    if (change._tag === tag) {
      return handler(change as Extract<Change, { _tag: Tag }>)
    }
    return {
      with: (nextTag: any, nextHandler: any) => match(change).with(nextTag, nextHandler),
      otherwise: (defaultHandler: (change: Change) => $A) => defaultHandler(change),
    }
  },
  otherwise: (defaultHandler: (change: Change) => $A): $A => defaultHandler(change),
})

/**
 * Group changes by category
 */
export const getCategory = (
  change: Change,
): 'type' | 'field' | 'enum' | 'input' | 'union' | 'interface' | 'directive' | 'schema' => {
  const tag = change._tag
  if (tag.startsWith('TYPE_')) return 'type'
  if (tag.startsWith('FIELD_')) return 'field'
  if (tag.startsWith('ENUM_')) return 'enum'
  if (tag.startsWith('INPUT_')) return 'input'
  if (tag.startsWith('UNION_')) return 'union'
  if (tag.startsWith('OBJECT_TYPE_INTERFACE_')) return 'interface'
  if (tag.startsWith('DIRECTIVE_')) return 'directive'
  if (tag.startsWith('SCHEMA_')) return 'schema'
  return 'type' // fallback
}

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Change)

// ============================================================================
// Group Classification
// ============================================================================

/**
 * Get the component group type for a change, used by the changelog UI
 */
export const getType = (
  change: Change,
):
  | 'TypeOperation'
  | 'TypeDescription'
  | 'FieldOperation'
  | 'FieldDescription'
  | 'FieldDeprecation'
  | 'FieldDeprecationReason'
  | 'FieldArgument'
  | 'FieldArgumentOperation'
  | 'FieldArgumentDescription'
  | 'EnumValueOperation'
  | 'EnumValueDescription'
  | 'EnumValueDeprecationReason'
  | 'InputFieldOperation'
  | 'InputFieldDescription'
  | 'InputFieldDefaultValue'
  | 'UnionMemberOperation'
  | 'ObjectTypeInterfaceOperation'
  | 'DirectiveOperation'
  | 'DirectiveDescription'
  | 'DirectiveLocationOperation'
  | 'DirectiveArgument'
  | 'DirectiveArgumentOperation'
  | 'DirectiveArgumentDescription'
  | 'SchemaRootType' =>
{
  const tag = change._tag

  // Type changes
  if (tag === 'TYPE_ADDED' || tag === 'TYPE_REMOVED' || tag === 'TYPE_KIND_CHANGED') {
    return 'TypeOperation'
  }
  if (tag === 'TYPE_DESCRIPTION_CHANGED' || tag === 'TYPE_DESCRIPTION_ADDED' || tag === 'TYPE_DESCRIPTION_REMOVED') {
    return 'TypeDescription'
  }

  // Field changes
  if (tag === 'FIELD_ADDED' || tag === 'FIELD_REMOVED' || tag === 'FIELD_TYPE_CHANGED') {
    return 'FieldOperation'
  }
  if (tag === 'FIELD_DESCRIPTION_CHANGED' || tag === 'FIELD_DESCRIPTION_ADDED' || tag === 'FIELD_DESCRIPTION_REMOVED') {
    return 'FieldDescription'
  }
  if (tag === 'FIELD_DEPRECATION_ADDED' || tag === 'FIELD_DEPRECATION_REMOVED') {
    return 'FieldDeprecation'
  }
  if (
    tag === 'FIELD_DEPRECATION_REASON_CHANGED' || tag === 'FIELD_DEPRECATION_REASON_ADDED'
    || tag === 'FIELD_DEPRECATION_REASON_REMOVED'
  ) {
    return 'FieldDeprecationReason'
  }

  // Field argument changes
  if (tag === 'FIELD_ARGUMENT_ADDED' || tag === 'FIELD_ARGUMENT_REMOVED') {
    return 'FieldArgument'
  }
  if (tag === 'FIELD_ARGUMENT_TYPE_CHANGED' || tag === 'FIELD_ARGUMENT_DEFAULT_CHANGED') {
    return 'FieldArgumentOperation'
  }
  if (tag === 'FIELD_ARGUMENT_DESCRIPTION_CHANGED') {
    return 'FieldArgumentDescription'
  }

  // Enum changes
  if (tag === 'ENUM_VALUE_ADDED' || tag === 'ENUM_VALUE_REMOVED') {
    return 'EnumValueOperation'
  }
  if (tag === 'ENUM_VALUE_DESCRIPTION_CHANGED') {
    return 'EnumValueDescription'
  }
  if (
    tag === 'ENUM_VALUE_DEPRECATION_REASON_CHANGED' || tag === 'ENUM_VALUE_DEPRECATION_REASON_ADDED'
    || tag === 'ENUM_VALUE_DEPRECATION_REASON_REMOVED'
  ) {
    return 'EnumValueDeprecationReason'
  }

  // Input field changes
  if (tag === 'INPUT_FIELD_ADDED' || tag === 'INPUT_FIELD_REMOVED' || tag === 'INPUT_FIELD_TYPE_CHANGED') {
    return 'InputFieldOperation'
  }
  if (
    tag === 'INPUT_FIELD_DESCRIPTION_ADDED' || tag === 'INPUT_FIELD_DESCRIPTION_REMOVED'
    || tag === 'INPUT_FIELD_DESCRIPTION_CHANGED'
  ) {
    return 'InputFieldDescription'
  }
  if (tag === 'INPUT_FIELD_DEFAULT_VALUE_CHANGED') {
    return 'InputFieldDefaultValue'
  }

  // Union changes
  if (tag === 'UNION_MEMBER_ADDED' || tag === 'UNION_MEMBER_REMOVED') {
    return 'UnionMemberOperation'
  }

  // Interface changes
  if (tag === 'OBJECT_TYPE_INTERFACE_ADDED' || tag === 'OBJECT_TYPE_INTERFACE_REMOVED') {
    return 'ObjectTypeInterfaceOperation'
  }

  // Directive changes
  if (tag === 'DIRECTIVE_ADDED' || tag === 'DIRECTIVE_REMOVED') {
    return 'DirectiveOperation'
  }
  if (tag === 'DIRECTIVE_DESCRIPTION_CHANGED') {
    return 'DirectiveDescription'
  }
  if (tag === 'DIRECTIVE_LOCATION_ADDED' || tag === 'DIRECTIVE_LOCATION_REMOVED') {
    return 'DirectiveLocationOperation'
  }
  if (tag === 'DIRECTIVE_ARGUMENT_ADDED' || tag === 'DIRECTIVE_ARGUMENT_REMOVED') {
    return 'DirectiveArgument'
  }
  if (tag === 'DIRECTIVE_ARGUMENT_TYPE_CHANGED' || tag === 'DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED') {
    return 'DirectiveArgumentOperation'
  }
  if (tag === 'DIRECTIVE_ARGUMENT_DESCRIPTION_CHANGED') {
    return 'DirectiveArgumentDescription'
  }

  // Schema changes
  if (
    tag === 'SCHEMA_QUERY_TYPE_CHANGED' || tag === 'SCHEMA_MUTATION_TYPE_CHANGED'
    || tag === 'SCHEMA_SUBSCRIPTION_TYPE_CHANGED'
  ) {
    return 'SchemaRootType'
  }

  // This should never happen with our current change types
  // Throwing an error to catch any unmapped change types during development
  throw new Error(`Unknown change type: ${tag}`)
}
