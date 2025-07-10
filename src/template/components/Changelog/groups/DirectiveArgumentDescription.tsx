import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveArgumentDescription: React.FC<{ change: GraphqlChange.Group.DirectiveArgumentDescription }> = (
  { change },
) => {
  return (
    <ChangeBase change={change}>
      Changed description for directive <Code>@{change.meta.directiveName}</Code> argument{' '}
      <Code>{change.meta.directiveArgumentName}</Code>
    </ChangeBase>
  )
}
