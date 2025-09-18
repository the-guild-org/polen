import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

export const FieldArgumentOperation: React.FC<{ change: any }> = (
  { change },
) => {
  switch (change._tag) {
    case `FIELD_ARGUMENT_ADDED`:
      return (
        <ChangeBase change={change}>
          Added argument <Code>{change.argumentName}</Code> to field <Code>{change.fieldName}</Code> on{' '}
          <Code>{change.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_ARGUMENT_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed argument <Code>{change.argumentName}</Code> from field <Code>{change.fieldName}</Code> on{' '}
          <Code>{change.typeName}</Code>
        </ChangeBase>
      )
  }
}
