import type {
  Change,
  DirectiveAddedChange,
  DirectiveArgumentAddedChange,
  DirectiveArgumentDefaultValueChangedChange,
  DirectiveArgumentDescriptionChangedChange,
  DirectiveArgumentRemovedChange,
  DirectiveArgumentTypeChangedChange,
  DirectiveDescriptionChangedChange,
  DirectiveLocationAddedChange,
  DirectiveLocationRemovedChange,
  DirectiveRemovedChange,
  DirectiveUsageArgumentDefinitionAddedChange,
  DirectiveUsageArgumentDefinitionRemovedChange,
  DirectiveUsageEnumAddedChange,
  DirectiveUsageEnumRemovedChange,
  DirectiveUsageEnumValueAddedChange,
  DirectiveUsageEnumValueRemovedChange,
  DirectiveUsageFieldAddedChange,
  DirectiveUsageFieldDefinitionAddedChange,
  DirectiveUsageFieldDefinitionRemovedChange,
  DirectiveUsageFieldRemovedChange,
  DirectiveUsageInputFieldDefinitionAddedChange,
  DirectiveUsageInputFieldDefinitionRemovedChange,
  DirectiveUsageInputObjectAddedChange,
  DirectiveUsageInputObjectRemovedChange,
  DirectiveUsageInterfaceAddedChange,
  DirectiveUsageInterfaceRemovedChange,
  DirectiveUsageObjectAddedChange,
  DirectiveUsageObjectRemovedChange,
  DirectiveUsageScalarAddedChange,
  DirectiveUsageScalarRemovedChange,
  DirectiveUsageSchemaAddedChange,
  DirectiveUsageSchemaRemovedChange,
  DirectiveUsageUnionMemberAddedChange,
  DirectiveUsageUnionMemberRemovedChange,
  EnumValueAddedChange,
  EnumValueDeprecationReasonAddedChange,
  EnumValueDeprecationReasonChangedChange,
  EnumValueDeprecationReasonRemovedChange,
  EnumValueDescriptionChangedChange,
  EnumValueRemovedChange,
  FieldAddedChange,
  FieldArgumentAddedChange,
  FieldArgumentDefaultChangedChange,
  FieldArgumentDescriptionChangedChange,
  FieldArgumentRemovedChange,
  FieldArgumentTypeChangedChange,
  FieldDeprecationAddedChange,
  FieldDeprecationReasonAddedChange,
  FieldDeprecationReasonChangedChange,
  FieldDeprecationReasonRemovedChange,
  FieldDeprecationRemovedChange,
  FieldDescriptionAddedChange,
  FieldDescriptionChangedChange,
  FieldDescriptionRemovedChange,
  FieldRemovedChange,
  FieldTypeChangedChange,
  InputFieldAddedChange,
  InputFieldDefaultValueChangedChange,
  InputFieldDescriptionAddedChange,
  InputFieldDescriptionChangedChange,
  InputFieldDescriptionRemovedChange,
  InputFieldRemovedChange,
  InputFieldTypeChangedChange,
  ObjectTypeInterfaceAddedChange,
  ObjectTypeInterfaceRemovedChange,
  SchemaMutationTypeChangedChange,
  SchemaQueryTypeChangedChange,
  SchemaSubscriptionTypeChangedChange,
  TypeAddedChange,
  TypeDescriptionAddedChange,
  TypeDescriptionChangedChange,
  TypeDescriptionRemovedChange,
  TypeKindChangedChange,
  TypeRemovedChange,
  UnionMemberAddedChange,
  UnionMemberRemovedChange,
} from './change-types.js'

// Type operations
export type TypeOperation = TypeAddedChange | TypeRemovedChange | TypeKindChangedChange
export const isTypeOperation = (change: Change): change is TypeOperation =>
  change.type === `TYPE_ADDED` || change.type === `TYPE_REMOVED` || change.type === `TYPE_KIND_CHANGED`

// Type descriptions
export type TypeDescription = TypeDescriptionAddedChange | TypeDescriptionRemovedChange | TypeDescriptionChangedChange
export const isTypeDescription = (change: Change): change is TypeDescription =>
  change.type === `TYPE_DESCRIPTION_ADDED` || change.type === `TYPE_DESCRIPTION_REMOVED`
  || change.type === `TYPE_DESCRIPTION_CHANGED`

// Field operations
export type FieldOperation = FieldAddedChange | FieldRemovedChange | FieldTypeChangedChange
export const isFieldOperation = (change: Change): change is FieldOperation =>
  change.type === `FIELD_ADDED` || change.type === `FIELD_REMOVED` || change.type === `FIELD_TYPE_CHANGED`

// Field descriptions
export type FieldDescription =
  | FieldDescriptionAddedChange
  | FieldDescriptionRemovedChange
  | FieldDescriptionChangedChange
export const isFieldDescription = (change: Change): change is FieldDescription =>
  change.type === `FIELD_DESCRIPTION_ADDED` || change.type === `FIELD_DESCRIPTION_REMOVED`
  || change.type === `FIELD_DESCRIPTION_CHANGED`

// Field deprecation
export type FieldDeprecation = FieldDeprecationAddedChange | FieldDeprecationRemovedChange
export const isFieldDeprecation = (change: Change): change is FieldDeprecation =>
  change.type === `FIELD_DEPRECATION_ADDED` || change.type === `FIELD_DEPRECATION_REMOVED`

// Field deprecation reason
export type FieldDeprecationReason =
  | FieldDeprecationReasonAddedChange
  | FieldDeprecationReasonRemovedChange
  | FieldDeprecationReasonChangedChange
export const isFieldDeprecationReason = (change: Change): change is FieldDeprecationReason =>
  change.type === `FIELD_DEPRECATION_REASON_ADDED` || change.type === `FIELD_DEPRECATION_REASON_REMOVED`
  || change.type === `FIELD_DEPRECATION_REASON_CHANGED`

// Field argument operations
export type FieldArgumentOperation = FieldArgumentAddedChange | FieldArgumentRemovedChange
export const isFieldArgumentOperation = (change: Change): change is FieldArgumentOperation =>
  change.type === `FIELD_ARGUMENT_ADDED` || change.type === `FIELD_ARGUMENT_REMOVED`

// Field argument changes
export type FieldArgument = FieldArgumentDefaultChangedChange | FieldArgumentTypeChangedChange
export const isFieldArgument = (change: Change): change is FieldArgument =>
  change.type === `FIELD_ARGUMENT_DEFAULT_CHANGED` || change.type === `FIELD_ARGUMENT_TYPE_CHANGED`

// Field argument description
export type FieldArgumentDescription = FieldArgumentDescriptionChangedChange
export const isFieldArgumentDescription = (change: Change): change is FieldArgumentDescription =>
  change.type === `FIELD_ARGUMENT_DESCRIPTION_CHANGED`

// Enum value operations
export type EnumValueOperation = EnumValueAddedChange | EnumValueRemovedChange
export const isEnumValueOperation = (change: Change): change is EnumValueOperation =>
  change.type === `ENUM_VALUE_ADDED` || change.type === `ENUM_VALUE_REMOVED`

// Enum value description
export type EnumValueDescription = EnumValueDescriptionChangedChange
export const isEnumValueDescription = (change: Change): change is EnumValueDescription =>
  change.type === `ENUM_VALUE_DESCRIPTION_CHANGED`

// Enum value deprecation reason
export type EnumValueDeprecationReason =
  | EnumValueDeprecationReasonAddedChange
  | EnumValueDeprecationReasonRemovedChange
  | EnumValueDeprecationReasonChangedChange
export const isEnumValueDeprecationReason = (change: Change): change is EnumValueDeprecationReason =>
  change.type === `ENUM_VALUE_DEPRECATION_REASON_ADDED` || change.type === `ENUM_VALUE_DEPRECATION_REASON_REMOVED`
  || change.type === `ENUM_VALUE_DEPRECATION_REASON_CHANGED`

// Input field operations
export type InputFieldOperation = InputFieldAddedChange | InputFieldRemovedChange | InputFieldTypeChangedChange
export const isInputFieldOperation = (change: Change): change is InputFieldOperation =>
  change.type === `INPUT_FIELD_ADDED` || change.type === `INPUT_FIELD_REMOVED`
  || change.type === `INPUT_FIELD_TYPE_CHANGED`

// Input field descriptions
export type InputFieldDescription =
  | InputFieldDescriptionAddedChange
  | InputFieldDescriptionRemovedChange
  | InputFieldDescriptionChangedChange
export const isInputFieldDescription = (change: Change): change is InputFieldDescription =>
  change.type === `INPUT_FIELD_DESCRIPTION_ADDED` || change.type === `INPUT_FIELD_DESCRIPTION_REMOVED`
  || change.type === `INPUT_FIELD_DESCRIPTION_CHANGED`

// Input field default value
export type InputFieldDefaultValue = InputFieldDefaultValueChangedChange
export const isInputFieldDefaultValue = (change: Change): change is InputFieldDefaultValue =>
  change.type === `INPUT_FIELD_DEFAULT_VALUE_CHANGED`

// Union member operations
export type UnionMemberOperation = UnionMemberAddedChange | UnionMemberRemovedChange
export const isUnionMemberOperation = (change: Change): change is UnionMemberOperation =>
  change.type === `UNION_MEMBER_ADDED` || change.type === `UNION_MEMBER_REMOVED`

// Object type interface operations
export type ObjectTypeInterfaceOperation = ObjectTypeInterfaceAddedChange | ObjectTypeInterfaceRemovedChange
export const isObjectTypeInterfaceOperation = (change: Change): change is ObjectTypeInterfaceOperation =>
  change.type === `OBJECT_TYPE_INTERFACE_ADDED` || change.type === `OBJECT_TYPE_INTERFACE_REMOVED`

// Directive operations
export type DirectiveOperation = DirectiveAddedChange | DirectiveRemovedChange
export const isDirectiveOperation = (change: Change): change is DirectiveOperation =>
  change.type === `DIRECTIVE_ADDED` || change.type === `DIRECTIVE_REMOVED`

// Directive description
export type DirectiveDescription = DirectiveDescriptionChangedChange
export const isDirectiveDescription = (change: Change): change is DirectiveDescription =>
  change.type === `DIRECTIVE_DESCRIPTION_CHANGED`

// Directive location operations
export type DirectiveLocationOperation = DirectiveLocationAddedChange | DirectiveLocationRemovedChange
export const isDirectiveLocationOperation = (change: Change): change is DirectiveLocationOperation =>
  change.type === `DIRECTIVE_LOCATION_ADDED` || change.type === `DIRECTIVE_LOCATION_REMOVED`

// Directive argument operations
export type DirectiveArgumentOperation = DirectiveArgumentAddedChange | DirectiveArgumentRemovedChange
export const isDirectiveArgumentOperation = (change: Change): change is DirectiveArgumentOperation =>
  change.type === `DIRECTIVE_ARGUMENT_ADDED` || change.type === `DIRECTIVE_ARGUMENT_REMOVED`

// Directive argument changes
export type DirectiveArgument = DirectiveArgumentDefaultValueChangedChange | DirectiveArgumentTypeChangedChange
export const isDirectiveArgument = (change: Change): change is DirectiveArgument =>
  change.type === `DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED` || change.type === `DIRECTIVE_ARGUMENT_TYPE_CHANGED`

// Directive argument description
export type DirectiveArgumentDescription = DirectiveArgumentDescriptionChangedChange
export const isDirectiveArgumentDescription = (change: Change): change is DirectiveArgumentDescription =>
  change.type === `DIRECTIVE_ARGUMENT_DESCRIPTION_CHANGED`

// Schema root type changes
export type SchemaRootType =
  | SchemaQueryTypeChangedChange
  | SchemaMutationTypeChangedChange
  | SchemaSubscriptionTypeChangedChange
export const isSchemaRootType = (change: Change): change is SchemaRootType =>
  change.type === `SCHEMA_QUERY_TYPE_CHANGED` || change.type === `SCHEMA_MUTATION_TYPE_CHANGED`
  || change.type === `SCHEMA_SUBSCRIPTION_TYPE_CHANGED`

// Directive usage changes
export type DirectiveUsage =
  | DirectiveUsageUnionMemberAddedChange
  | DirectiveUsageUnionMemberRemovedChange
  | DirectiveUsageEnumAddedChange
  | DirectiveUsageEnumRemovedChange
  | DirectiveUsageEnumValueAddedChange
  | DirectiveUsageEnumValueRemovedChange
  | DirectiveUsageInputObjectAddedChange
  | DirectiveUsageInputObjectRemovedChange
  | DirectiveUsageFieldAddedChange
  | DirectiveUsageFieldRemovedChange
  | DirectiveUsageScalarAddedChange
  | DirectiveUsageScalarRemovedChange
  | DirectiveUsageObjectAddedChange
  | DirectiveUsageObjectRemovedChange
  | DirectiveUsageInterfaceAddedChange
  | DirectiveUsageInterfaceRemovedChange
  | DirectiveUsageArgumentDefinitionAddedChange
  | DirectiveUsageArgumentDefinitionRemovedChange
  | DirectiveUsageSchemaAddedChange
  | DirectiveUsageSchemaRemovedChange
  | DirectiveUsageFieldDefinitionAddedChange
  | DirectiveUsageFieldDefinitionRemovedChange
  | DirectiveUsageInputFieldDefinitionAddedChange
  | DirectiveUsageInputFieldDefinitionRemovedChange

export const isDirectiveUsage = (change: Change): change is DirectiveUsage => change.type.startsWith(`DIRECTIVE_USAGE_`)
