import { Code } from '@radix-ui/themes'
import { Change as GraphqlChange } from 'graphql-kit'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldArgumentDescription: React.FC<{ change: any }> = (
  { change },
) => {
  return (
    <ChangeBase change={change}>
      Changed description for argument <Code>{change.argumentName}</Code> on field <Code>{change.fieldName}</Code> on
      {' '}
      <Code>{change.typeName}</Code>
    </ChangeBase>
  )
}
