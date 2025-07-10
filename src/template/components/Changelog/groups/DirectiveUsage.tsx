import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveUsage: React.FC<{ change: GraphqlChange.Group.DirectiveUsage }> = ({ change }) => {
  const isAdded = change.type.includes(`_ADDED`)
  const action = isAdded ? `Added` : `Removed`
  const preposition = isAdded ? `to` : `from`

  // Helper to get the directive name based on whether it's added or removed
  const getDirectiveName = () => {
    if (`addedDirectiveName` in change.meta) {
      return change.meta.addedDirectiveName
    }
    if (`removedDirectiveName` in change.meta) {
      return change.meta.removedDirectiveName
    }
    return ``
  }

  const directiveName = getDirectiveName()

  switch (change.type) {
    case `DIRECTIVE_USAGE_UNION_MEMBER_ADDED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} union member{' '}
          <Code>{change.meta.addedUnionMemberTypeName}</Code> on union <Code>{change.meta.unionName}</Code>
        </ChangeBase>
      )
    case `DIRECTIVE_USAGE_UNION_MEMBER_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} union member{' '}
          <Code>{change.meta.removedUnionMemberTypeName}</Code> on union <Code>{change.meta.unionName}</Code>
        </ChangeBase>
      )

    case `DIRECTIVE_USAGE_ENUM_ADDED`:
    case `DIRECTIVE_USAGE_ENUM_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} enum <Code>{change.meta.enumName}</Code>
        </ChangeBase>
      )

    case `DIRECTIVE_USAGE_ENUM_VALUE_ADDED`:
    case `DIRECTIVE_USAGE_ENUM_VALUE_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} enum value{' '}
          <Code>{change.meta.enumValueName}</Code> on <Code>{change.meta.enumName}</Code>
        </ChangeBase>
      )

    case `DIRECTIVE_USAGE_INPUT_OBJECT_ADDED`:
    case `DIRECTIVE_USAGE_INPUT_OBJECT_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} input object{' '}
          <Code>{change.meta.inputObjectName}</Code>
        </ChangeBase>
      )

    case `DIRECTIVE_USAGE_FIELD_ADDED`:
    case `DIRECTIVE_USAGE_FIELD_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} field <Code>{change.meta.fieldName}</Code> on
          {' '}
          <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )

    case `DIRECTIVE_USAGE_SCALAR_ADDED`:
    case `DIRECTIVE_USAGE_SCALAR_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} scalar <Code>{change.meta.scalarName}</Code>
        </ChangeBase>
      )

    case `DIRECTIVE_USAGE_OBJECT_ADDED`:
    case `DIRECTIVE_USAGE_OBJECT_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} object <Code>{change.meta.objectName}</Code>
        </ChangeBase>
      )

    case `DIRECTIVE_USAGE_INTERFACE_ADDED`:
    case `DIRECTIVE_USAGE_INTERFACE_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} interface{' '}
          <Code>{change.meta.interfaceName}</Code>
        </ChangeBase>
      )

    case `DIRECTIVE_USAGE_ARGUMENT_DEFINITION_ADDED`:
    case `DIRECTIVE_USAGE_ARGUMENT_DEFINITION_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} argument{' '}
          <Code>{change.meta.argumentName}</Code> on <Code>{change.meta.fieldName}</Code> field on{' '}
          <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )

    case `DIRECTIVE_USAGE_SCHEMA_ADDED`:
    case `DIRECTIVE_USAGE_SCHEMA_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} schema
        </ChangeBase>
      )

    case `DIRECTIVE_USAGE_FIELD_DEFINITION_ADDED`:
    case `DIRECTIVE_USAGE_FIELD_DEFINITION_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} field definition{' '}
          <Code>{change.meta.fieldName}</Code> on <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )

    case `DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_ADDED`:
    case `DIRECTIVE_USAGE_INPUT_FIELD_DEFINITION_REMOVED`:
      return (
        <ChangeBase change={change}>
          {action} directive <Code>@{directiveName}</Code> {preposition} input field{' '}
          <Code>{change.meta.inputFieldName}</Code> on <Code>{change.meta.inputObjectName}</Code>
        </ChangeBase>
      )
  }
}
