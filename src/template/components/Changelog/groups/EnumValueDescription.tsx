import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type EnumValueDescriptionChange = typeof Change.EnumValueDescriptionChanged.Type

interface EnumValueDescriptionProps {
  change: EnumValueDescriptionChange
}

export const EnumValueDescription: React.FC<EnumValueDescriptionProps> = ({ change }) => {
  return (
    <ChangeBase change={change}>
      Changed description for enum value <Code>{change.value}</Code> on <Code>{change.enumName}</Code>
    </ChangeBase>
  )
}
