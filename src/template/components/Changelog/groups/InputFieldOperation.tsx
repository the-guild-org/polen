import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

export const InputFieldOperation: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `INPUT_FIELD_ADDED`:
      return (
        <ChangeBase change={change}>
          Added input field <Code>{change.fieldName}</Code> to <Code>{change.inputName}</Code>
        </ChangeBase>
      )
    case `INPUT_FIELD_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed input field <Code>{change.fieldName}</Code> from <Code>{change.inputName}</Code>
        </ChangeBase>
      )
    case `INPUT_FIELD_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed field <Code>{change.fieldName}</Code> type from <Code>{change.oldType}</Code> to{' '}
          <Code>{change.newType}</Code> on input <Code>{change.inputName}</Code>
        </ChangeBase>
      )
  }
}
