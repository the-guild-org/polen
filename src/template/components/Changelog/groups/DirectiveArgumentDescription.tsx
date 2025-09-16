import { Code } from '@radix-ui/themes'
import { Change as GraphqlChange } from 'graphql-kit'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveArgumentDescription: React.FC<{ change: any }> = (
  { change },
) => {
  return (
    <ChangeBase change={change}>
      Changed description for directive <Code>@{change.directiveName}</Code> argument <Code>{change.argumentName}</Code>
    </ChangeBase>
  )
}
