import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveArgumentOperation: React.FC<{ change: GraphqlChange.Group.DirectiveArgumentOperation }> = (
  { change },
) => {
  switch (change.type) {
    case `DIRECTIVE_ARGUMENT_ADDED`:
      return (
        <ChangeBase change={change}>
          Added argument <Code>{change.meta.addedDirectiveArgumentName}</Code> to directive{' '}
          <Code>@{change.meta.directiveName}</Code>
        </ChangeBase>
      )
    case `DIRECTIVE_ARGUMENT_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed argument <Code>{change.meta.removedDirectiveArgumentName}</Code> from directive{' '}
          <Code>@{change.meta.directiveName}</Code>
        </ChangeBase>
      )
  }
}
