import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const InputFieldDefaultValue: React.FC<{ change: any }> = (
  { change },
) => {
  return (
    <ChangeBase change={change}>
      Changed default value for input field <Code>{change.fieldName}</Code> on <Code>{change.inputName}</Code> from{' '}
      <Code>{change.oldDefault}</Code> to <Code>{change.newDefault}</Code>
    </ChangeBase>
  )
}
