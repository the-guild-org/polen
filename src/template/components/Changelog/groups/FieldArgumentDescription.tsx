import type { GraphqlChange } from '#lib/graphql-change'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldArgumentDescription: React.FC<{ change: GraphqlChange.Group.FieldArgumentDescription }> = (
  { change },
) => {
  return (
    <ChangeBase change={change}>
      Changed description for argument <Code>{change.meta.argumentName}</Code> on field{' '}
      <Code>{change.meta.fieldName}</Code> on <Code>{change.meta.typeName}</Code>
    </ChangeBase>
  )
}
