import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldArgument: React.FC<{ change: GraphqlChange.Group.FieldArgument }> = ({ change }) => {
  switch (change.type) {
    case `FIELD_ARGUMENT_DEFAULT_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed default value for argument <Code>{change.meta.argumentName}</Code> on field{' '}
          <Code>{change.meta.fieldName}</Code> on <Code>{change.meta.typeName}</Code> from{' '}
          <Code>{change.meta.oldDefaultValue}</Code> to <Code>{change.meta.newDefaultValue}</Code>
        </ChangeBase>
      )
    case `FIELD_ARGUMENT_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed argument <Code>{change.meta.argumentName}</Code> type from <Code>{change.meta.oldArgumentType}</Code>
          {' '}
          to <Code>{change.meta.newArgumentType}</Code> on field <Code>{change.meta.fieldName}</Code> on{' '}
          <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
  }
}
