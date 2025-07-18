import type { GraphqlChange } from '#lib/graphql-change'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const InputFieldDefaultValue: React.FC<{ change: GraphqlChange.Group.InputFieldDefaultValue }> = (
  { change },
) => {
  return (
    <ChangeBase change={change}>
      Changed default value for input field <Code>{change.meta.inputFieldName}</Code> on{' '}
      <Code>{change.meta.inputName}</Code> from <Code>{change.meta.oldDefaultValue}</Code> to{' '}
      <Code>{change.meta.newDefaultValue}</Code>
    </ChangeBase>
  )
}
