import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type DirectiveDescriptionChange = typeof Change.DirectiveDescriptionChanged.Type

interface DirectiveDescriptionProps {
  change: DirectiveDescriptionChange
}

export const DirectiveDescription: React.FC<DirectiveDescriptionProps> = ({ change }) => {
  return (
    <ChangeBase change={change}>
      Changed description for directive <Code>@{change.name}</Code>
    </ChangeBase>
  )
}
