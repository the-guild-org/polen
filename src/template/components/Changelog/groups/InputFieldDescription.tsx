import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const InputFieldDescription: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `INPUT_FIELD_DESCRIPTION_ADDED`:
      return (
        <ChangeBase change={change}>
          Added description to input field <Code>{change.fieldName}</Code> on <Code>{change.inputName}</Code>
        </ChangeBase>
      )
    case `INPUT_FIELD_DESCRIPTION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed description from input field <Code>{change.fieldName}</Code> on <Code>{change.inputName}</Code>
        </ChangeBase>
      )
    case `INPUT_FIELD_DESCRIPTION_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed description for input field <Code>{change.fieldName}</Code> on <Code>{change.inputName}</Code>
        </ChangeBase>
      )
  }
}
