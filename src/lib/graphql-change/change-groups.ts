import { neverCase } from '@wollybeard/kit/language'
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

export type Type =
  | 'TypeOperation'
  | 'TypeDescription'
  | 'FieldOperation'
  | 'FieldDescription'
  | 'FieldDeprecation'
  | 'FieldDeprecationReason'
  | 'FieldArgumentOperation'
  | 'FieldArgument'
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
  | 'DirectiveArgumentOperation'
  | 'DirectiveArgument'
  | 'DirectiveArgumentDescription'
  | 'SchemaRootType'
  | 'DirectiveUsage'

/**
 * Conditional type that maps each change type to its corresponding group type
 */
export type getType<$Change extends Change> = $Change extends TypeOperation ? 'TypeOperation'
  : $Change extends TypeDescription ? 'TypeDescription'
  : $Change extends FieldOperation ? 'FieldOperation'
  : $Change extends FieldDescription ? 'FieldDescription'
  : $Change extends FieldDeprecation ? 'FieldDeprecation'
  : $Change extends FieldDeprecationReason ? 'FieldDeprecationReason'
  : $Change extends FieldArgumentOperation ? 'FieldArgumentOperation'
  : $Change extends FieldArgument ? 'FieldArgument'
  : $Change extends FieldArgumentDescription ? 'FieldArgumentDescription'
  : $Change extends EnumValueOperation ? 'EnumValueOperation'
  : $Change extends EnumValueDescription ? 'EnumValueDescription'
  : $Change extends EnumValueDeprecationReason ? 'EnumValueDeprecationReason'
  : $Change extends InputFieldOperation ? 'InputFieldOperation'
  : $Change extends InputFieldDescription ? 'InputFieldDescription'
  : $Change extends InputFieldDefaultValue ? 'InputFieldDefaultValue'
  : $Change extends UnionMemberOperation ? 'UnionMemberOperation'
  : $Change extends ObjectTypeInterfaceOperation ? 'ObjectTypeInterfaceOperation'
  : $Change extends DirectiveOperation ? 'DirectiveOperation'
  : $Change extends DirectiveDescription ? 'DirectiveDescription'
  : $Change extends DirectiveLocationOperation ? 'DirectiveLocationOperation'
  : $Change extends DirectiveArgumentOperation ? 'DirectiveArgumentOperation'
  : $Change extends DirectiveArgument ? 'DirectiveArgument'
  : $Change extends DirectiveArgumentDescription ? 'DirectiveArgumentDescription'
  : $Change extends SchemaRootType ? 'SchemaRootType'
  : $Change extends DirectiveUsage ? 'DirectiveUsage'
  : never

export const getType = <change extends Change>(change: change): getType<change> => {
  if (isTypeOperation(change)) return 'TypeOperation' as getType<change>
  if (isTypeDescription(change)) return 'TypeDescription' as getType<change>
  if (isFieldOperation(change)) return 'FieldOperation' as getType<change>
  if (isFieldDescription(change)) return 'FieldDescription' as getType<change>
  if (isFieldDeprecation(change)) return 'FieldDeprecation' as getType<change>
  if (isFieldDeprecationReason(change)) return 'FieldDeprecationReason' as getType<change>
  if (isFieldArgumentOperation(change)) return 'FieldArgumentOperation' as getType<change>
  if (isFieldArgument(change)) return 'FieldArgument' as getType<change>
  if (isFieldArgumentDescription(change)) return 'FieldArgumentDescription' as getType<change>
  if (isEnumValueOperation(change)) return 'EnumValueOperation' as getType<change>
  if (isEnumValueDescription(change)) return 'EnumValueDescription' as getType<change>
  if (isEnumValueDeprecationReason(change)) return 'EnumValueDeprecationReason' as getType<change>
  if (isInputFieldOperation(change)) return 'InputFieldOperation' as getType<change>
  if (isInputFieldDescription(change)) return 'InputFieldDescription' as getType<change>
  if (isInputFieldDefaultValue(change)) return 'InputFieldDefaultValue' as getType<change>
  if (isUnionMemberOperation(change)) return 'UnionMemberOperation' as getType<change>
  if (isObjectTypeInterfaceOperation(change)) return 'ObjectTypeInterfaceOperation' as getType<change>
  if (isDirectiveOperation(change)) return 'DirectiveOperation' as getType<change>
  if (isDirectiveDescription(change)) return 'DirectiveDescription' as getType<change>
  if (isDirectiveLocationOperation(change)) return 'DirectiveLocationOperation' as getType<change>
  if (isDirectiveArgumentOperation(change)) return 'DirectiveArgumentOperation' as getType<change>
  if (isDirectiveArgument(change)) return 'DirectiveArgument' as getType<change>
  if (isDirectiveArgumentDescription(change)) return 'DirectiveArgumentDescription' as getType<change>
  if (isSchemaRootType(change)) return 'SchemaRootType' as getType<change>
  if (isDirectiveUsage(change)) return 'DirectiveUsage' as getType<change>
  neverCase(change)
}
