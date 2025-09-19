import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type FieldArgumentDescriptionChange = typeof Change.FieldArgumentDescriptionChanged.Type

interface FieldArgumentDescriptionProps {
  change: FieldArgumentDescriptionChange
}

export const FieldArgumentDescription: React.FC<FieldArgumentDescriptionProps> = (
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
