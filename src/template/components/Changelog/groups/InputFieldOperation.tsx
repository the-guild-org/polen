import type { GraphqlChange } from '#lib/graphql-change'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const InputFieldOperation: React.FC<{ change: GraphqlChange.Group.InputFieldOperation }> = ({ change }) => {
  switch (change.type) {
    case `INPUT_FIELD_ADDED`:
      return (
        <ChangeBase change={change}>
          Added input field <Code>{change.meta.addedInputFieldName}</Code> to <Code>{change.meta.inputName}</Code>
        </ChangeBase>
      )
    case `INPUT_FIELD_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed input field <Code>{change.meta.removedFieldName}</Code> from <Code>{change.meta.inputName}</Code>
        </ChangeBase>
      )
    case `INPUT_FIELD_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed field <Code>{change.meta.inputFieldName}</Code> type from <Code>{change.meta.oldInputFieldType}</Code>
          {' '}
          to <Code>{change.meta.newInputFieldType}</Code> on input <Code>{change.meta.inputName}</Code>
        </ChangeBase>
      )
  }
}
