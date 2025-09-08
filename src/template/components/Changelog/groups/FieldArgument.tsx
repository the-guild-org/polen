import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldArgument: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `FIELD_ARGUMENT_DEFAULT_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed default value for argument <Code>{change.argumentName}</Code> on field <Code>{change.fieldName}</Code>
          {' '}
          on <Code>{change.typeName}</Code> from <Code>{change.oldDefault}</Code> to <Code>{change.newDefault}</Code>
        </ChangeBase>
      )
    case `FIELD_ARGUMENT_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed argument <Code>{change.argumentName}</Code> type from <Code>{change.oldType}</Code> to{' '}
          <Code>{change.newType}</Code> on field <Code>{change.fieldName}</Code> on <Code>{change.typeName}</Code>
        </ChangeBase>
      )
  }
}
