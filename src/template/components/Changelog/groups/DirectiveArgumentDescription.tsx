import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type DirectiveArgumentDescriptionChange = typeof Change.DirectiveArgumentDescriptionChanged.Type

interface DirectiveArgumentDescriptionProps {
  change: DirectiveArgumentDescriptionChange
}

export const DirectiveArgumentDescription: React.FC<DirectiveArgumentDescriptionProps> = (
  { change },
) => {
  return (
    <ChangeBase change={change}>
      Changed description for directive <Code>@{change.directiveName}</Code> argument <Code>{change.argumentName}</Code>
    </ChangeBase>
  )
}
