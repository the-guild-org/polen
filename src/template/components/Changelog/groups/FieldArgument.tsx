import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type FieldArgumentChange =
  | typeof Change.FieldArgumentDefaultChanged.Type
  | typeof Change.FieldArgumentTypeChanged.Type

interface FieldArgumentProps {
  change: FieldArgumentChange
}

export const FieldArgument: React.FC<FieldArgumentProps> = ({ change }) => {
  switch (change._tag) {
    case `FIELD_ARGUMENT_DEFAULT_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed default value for argument <Code>{change.argumentName}</Code> on field <Code>{change.fieldName}</Code>
          {' '}
          on <Code>{change.typeName}</Code> from <Code>{String(change.oldDefault)}</Code> to{' '}
          <Code>{String(change.newDefault)}</Code>
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
