// dprint-ignore-file
import type { GraphqlInspector } from '#dep/graphql-inspector/index'

/**
 * Additional properties that Polen adds to GraphQL Inspector changes
 */
export interface ChangeExtensions {
  message: string
  path?: string
  criticality: GraphqlInspector.Core.Criticality
}

// Type changes
export interface TypeAddedChange extends GraphqlInspector.Core.TypeAddedChange, ChangeExtensions {}
export interface TypeRemovedChange extends GraphqlInspector.Core.TypeRemovedChange, ChangeExtensions {}
export interface TypeKindChangedChange extends GraphqlInspector.Core.TypeKindChangedChange, ChangeExtensions {}
export interface TypeDescriptionChangedChange extends GraphqlInspector.Core.TypeDescriptionChangedChange, ChangeExtensions {}
export interface TypeDescriptionAddedChange extends GraphqlInspector.Core.TypeDescriptionAddedChange, ChangeExtensions {}
export interface TypeDescriptionRemovedChange extends GraphqlInspector.Core.TypeDescriptionRemovedChange, ChangeExtensions {}

// Field changes
export interface FieldAddedChange extends GraphqlInspector.Core.FieldAddedChange, ChangeExtensions {}
export interface FieldRemovedChange extends GraphqlInspector.Core.FieldRemovedChange, ChangeExtensions {}
export interface FieldTypeChangedChange extends GraphqlInspector.Core.FieldTypeChangedChange, ChangeExtensions {}
// Note: GraphQL Inspector doesn't have FieldDeprecatedChange, it's handled by FieldDeprecationAddedChange
export interface FieldDeprecationAddedChange extends GraphqlInspector.Core.FieldDeprecationAddedChange, ChangeExtensions {}
export interface FieldDeprecationRemovedChange extends GraphqlInspector.Core.FieldDeprecationRemovedChange, ChangeExtensions {}
export interface FieldDeprecationReasonChangedChange extends GraphqlInspector.Core.FieldDeprecationReasonChangedChange, ChangeExtensions {}
export interface FieldDeprecationReasonAddedChange extends GraphqlInspector.Core.FieldDeprecationReasonAddedChange, ChangeExtensions {}
export interface FieldDeprecationReasonRemovedChange extends GraphqlInspector.Core.FieldDeprecationReasonRemovedChange, ChangeExtensions {}
export interface FieldDescriptionChangedChange extends GraphqlInspector.Core.FieldDescriptionChangedChange, ChangeExtensions {}
export interface FieldDescriptionAddedChange extends GraphqlInspector.Core.FieldDescriptionAddedChange, ChangeExtensions {}
export interface FieldDescriptionRemovedChange extends GraphqlInspector.Core.FieldDescriptionRemovedChange, ChangeExtensions {}

// Field argument changes
export interface FieldArgumentAddedChange extends GraphqlInspector.Core.FieldArgumentAddedChange, ChangeExtensions {}
export interface FieldArgumentRemovedChange extends GraphqlInspector.Core.FieldArgumentRemovedChange, ChangeExtensions {}
export interface FieldArgumentTypeChangedChange extends GraphqlInspector.Core.FieldArgumentTypeChangedChange, ChangeExtensions {}
export interface FieldArgumentDescriptionChangedChange extends GraphqlInspector.Core.FieldArgumentDescriptionChangedChange, ChangeExtensions {}
export interface FieldArgumentDefaultChangedChange extends GraphqlInspector.Core.FieldArgumentDefaultChangedChange, ChangeExtensions {}

// Enum changes
export interface EnumValueAddedChange extends GraphqlInspector.Core.EnumValueAddedChange, ChangeExtensions {}
export interface EnumValueRemovedChange extends GraphqlInspector.Core.EnumValueRemovedChange, ChangeExtensions {}
export interface EnumValueDescriptionChangedChange extends GraphqlInspector.Core.EnumValueDescriptionChangedChange, ChangeExtensions {}
export interface EnumValueDeprecationReasonAddedChange extends GraphqlInspector.Core.EnumValueDeprecationReasonAddedChange, ChangeExtensions {}
export interface EnumValueDeprecationReasonChangedChange extends GraphqlInspector.Core.EnumValueDeprecationReasonChangedChange, ChangeExtensions {}
export interface EnumValueDeprecationReasonRemovedChange extends GraphqlInspector.Core.EnumValueDeprecationReasonRemovedChange, ChangeExtensions {}

// Input field changes
export interface InputFieldAddedChange extends GraphqlInspector.Core.InputFieldAddedChange, ChangeExtensions {}
export interface InputFieldRemovedChange extends GraphqlInspector.Core.InputFieldRemovedChange, ChangeExtensions {}
export interface InputFieldTypeChangedChange extends GraphqlInspector.Core.InputFieldTypeChangedChange, ChangeExtensions {}
export interface InputFieldDescriptionAddedChange extends GraphqlInspector.Core.InputFieldDescriptionAddedChange, ChangeExtensions {}
export interface InputFieldDescriptionRemovedChange extends GraphqlInspector.Core.InputFieldDescriptionRemovedChange, ChangeExtensions {}
export interface InputFieldDescriptionChangedChange extends GraphqlInspector.Core.InputFieldDescriptionChangedChange, ChangeExtensions {}
export interface InputFieldDefaultValueChangedChange extends GraphqlInspector.Core.InputFieldDefaultValueChangedChange, ChangeExtensions {}

// Union changes
export interface UnionMemberAddedChange extends GraphqlInspector.Core.UnionMemberAddedChange, ChangeExtensions {}
export interface UnionMemberRemovedChange extends GraphqlInspector.Core.UnionMemberRemovedChange, ChangeExtensions {}

// Interface changes
export interface ObjectTypeInterfaceAddedChange extends GraphqlInspector.Core.ObjectTypeInterfaceAddedChange, ChangeExtensions {}
export interface ObjectTypeInterfaceRemovedChange extends GraphqlInspector.Core.ObjectTypeInterfaceRemovedChange, ChangeExtensions {}

// Directive changes
export interface DirectiveAddedChange extends GraphqlInspector.Core.DirectiveAddedChange, ChangeExtensions {}
export interface DirectiveRemovedChange extends GraphqlInspector.Core.DirectiveRemovedChange, ChangeExtensions {}
export interface DirectiveDescriptionChangedChange extends GraphqlInspector.Core.DirectiveDescriptionChangedChange, ChangeExtensions {}
export interface DirectiveLocationAddedChange extends GraphqlInspector.Core.DirectiveLocationAddedChange, ChangeExtensions {}
export interface DirectiveLocationRemovedChange extends GraphqlInspector.Core.DirectiveLocationRemovedChange, ChangeExtensions {}
export interface DirectiveArgumentAddedChange extends GraphqlInspector.Core.DirectiveArgumentAddedChange, ChangeExtensions {}
export interface DirectiveArgumentRemovedChange extends GraphqlInspector.Core.DirectiveArgumentRemovedChange, ChangeExtensions {}
export interface DirectiveArgumentDescriptionChangedChange extends GraphqlInspector.Core.DirectiveArgumentDescriptionChangedChange, ChangeExtensions {}
export interface DirectiveArgumentDefaultValueChangedChange extends GraphqlInspector.Core.DirectiveArgumentDefaultValueChangedChange, ChangeExtensions {}
export interface DirectiveArgumentTypeChangedChange extends GraphqlInspector.Core.DirectiveArgumentTypeChangedChange, ChangeExtensions {}

// Schema changes
export interface SchemaQueryTypeChangedChange extends GraphqlInspector.Core.SchemaQueryTypeChangedChange, ChangeExtensions {}
export interface SchemaMutationTypeChangedChange extends GraphqlInspector.Core.SchemaMutationTypeChangedChange, ChangeExtensions {}
export interface SchemaSubscriptionTypeChangedChange extends GraphqlInspector.Core.SchemaSubscriptionTypeChangedChange, ChangeExtensions {}

// Directive usage changes
export interface DirectiveUsageUnionMemberAddedChange extends GraphqlInspector.Core.DirectiveUsageUnionMemberAddedChange, ChangeExtensions {}
export interface DirectiveUsageUnionMemberRemovedChange extends GraphqlInspector.Core.DirectiveUsageUnionMemberRemovedChange, ChangeExtensions {}
export interface DirectiveUsageEnumAddedChange extends GraphqlInspector.Core.DirectiveUsageEnumAddedChange, ChangeExtensions {}
export interface DirectiveUsageEnumRemovedChange extends GraphqlInspector.Core.DirectiveUsageEnumRemovedChange, ChangeExtensions {}
export interface DirectiveUsageEnumValueAddedChange extends GraphqlInspector.Core.DirectiveUsageEnumValueAddedChange, ChangeExtensions {}
export interface DirectiveUsageEnumValueRemovedChange extends GraphqlInspector.Core.DirectiveUsageEnumValueRemovedChange, ChangeExtensions {}
export interface DirectiveUsageInputObjectAddedChange extends GraphqlInspector.Core.DirectiveUsageInputObjectAddedChange, ChangeExtensions {}
export interface DirectiveUsageInputObjectRemovedChange extends GraphqlInspector.Core.DirectiveUsageInputObjectRemovedChange, ChangeExtensions {}
export interface DirectiveUsageFieldAddedChange extends GraphqlInspector.Core.DirectiveUsageFieldAddedChange, ChangeExtensions {}
export interface DirectiveUsageFieldRemovedChange extends GraphqlInspector.Core.DirectiveUsageFieldRemovedChange, ChangeExtensions {}
export interface DirectiveUsageScalarAddedChange extends GraphqlInspector.Core.DirectiveUsageScalarAddedChange, ChangeExtensions {}
export interface DirectiveUsageScalarRemovedChange extends GraphqlInspector.Core.DirectiveUsageScalarRemovedChange, ChangeExtensions {}
export interface DirectiveUsageObjectAddedChange extends GraphqlInspector.Core.DirectiveUsageObjectAddedChange, ChangeExtensions {}
export interface DirectiveUsageObjectRemovedChange extends GraphqlInspector.Core.DirectiveUsageObjectRemovedChange, ChangeExtensions {}
export interface DirectiveUsageInterfaceAddedChange extends GraphqlInspector.Core.DirectiveUsageInterfaceAddedChange, ChangeExtensions {}
export interface DirectiveUsageInterfaceRemovedChange extends GraphqlInspector.Core.DirectiveUsageInterfaceRemovedChange, ChangeExtensions {}
export interface DirectiveUsageArgumentDefinitionAddedChange extends GraphqlInspector.Core.DirectiveUsageArgumentDefinitionAddedChange, ChangeExtensions {}
export interface DirectiveUsageArgumentDefinitionRemovedChange extends GraphqlInspector.Core.DirectiveUsageArgumentDefinitionRemovedChange, ChangeExtensions {}
export interface DirectiveUsageSchemaAddedChange extends GraphqlInspector.Core.DirectiveUsageSchemaAddedChange, ChangeExtensions {}
export interface DirectiveUsageSchemaRemovedChange extends GraphqlInspector.Core.DirectiveUsageSchemaRemovedChange, ChangeExtensions {}
export interface DirectiveUsageFieldDefinitionAddedChange extends GraphqlInspector.Core.DirectiveUsageFieldDefinitionAddedChange, ChangeExtensions {}
export interface DirectiveUsageFieldDefinitionRemovedChange extends GraphqlInspector.Core.DirectiveUsageFieldDefinitionRemovedChange, ChangeExtensions {}
export interface DirectiveUsageInputFieldDefinitionAddedChange extends GraphqlInspector.Core.DirectiveUsageInputFieldDefinitionAddedChange, ChangeExtensions {}
export interface DirectiveUsageInputFieldDefinitionRemovedChange extends GraphqlInspector.Core.DirectiveUsageInputFieldDefinitionRemovedChange, ChangeExtensions {}

/**
 * Discriminated union of all possible change types
 */
export type Change =
  | TypeAddedChange
  | TypeRemovedChange
  | TypeKindChangedChange
  | TypeDescriptionChangedChange
  | TypeDescriptionAddedChange
  | TypeDescriptionRemovedChange
  | FieldAddedChange
  | FieldRemovedChange
  | FieldTypeChangedChange
  // | FieldDeprecatedChange
  | FieldDeprecationAddedChange
  | FieldDeprecationRemovedChange
  | FieldDeprecationReasonChangedChange
  | FieldDeprecationReasonAddedChange
  | FieldDeprecationReasonRemovedChange
  | FieldDescriptionChangedChange
  | FieldDescriptionAddedChange
  | FieldDescriptionRemovedChange
  | FieldArgumentAddedChange
  | FieldArgumentRemovedChange
  | FieldArgumentTypeChangedChange
  | FieldArgumentDescriptionChangedChange
  | FieldArgumentDefaultChangedChange
  | EnumValueAddedChange
  | EnumValueRemovedChange
  | EnumValueDescriptionChangedChange
  | EnumValueDeprecationReasonAddedChange
  | EnumValueDeprecationReasonChangedChange
  | EnumValueDeprecationReasonRemovedChange
  | InputFieldAddedChange
  | InputFieldRemovedChange
  | InputFieldTypeChangedChange
  | InputFieldDescriptionAddedChange
  | InputFieldDescriptionRemovedChange
  | InputFieldDescriptionChangedChange
  | InputFieldDefaultValueChangedChange
  | UnionMemberAddedChange
  | UnionMemberRemovedChange
  | ObjectTypeInterfaceAddedChange
  | ObjectTypeInterfaceRemovedChange
  | DirectiveAddedChange
  | DirectiveRemovedChange
  | DirectiveDescriptionChangedChange
  | DirectiveLocationAddedChange
  | DirectiveLocationRemovedChange
  | DirectiveArgumentAddedChange
  | DirectiveArgumentRemovedChange
  | DirectiveArgumentDescriptionChangedChange
  | DirectiveArgumentDefaultValueChangedChange
  | DirectiveArgumentTypeChangedChange
  | SchemaQueryTypeChangedChange
  | SchemaMutationTypeChangedChange
  | SchemaSubscriptionTypeChangedChange
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

/**
 * Type guard to check if a value is a valid Change
 */
export const isChange = (value: unknown): value is Change => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'criticality' in value &&
    'message' in value
  )
}
