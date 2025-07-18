import type { GraphqlChange } from '#lib/graphql-change'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveLocationOperation: React.FC<{ change: GraphqlChange.Group.DirectiveLocationOperation }> = (
  { change },
) => {
  switch (change.type) {
    case `DIRECTIVE_LOCATION_ADDED`:
      return (
        <ChangeBase change={change}>
          Directive <Code>@{change.meta.directiveName}</Code> can now be used on{' '}
          <Code>{change.meta.addedDirectiveLocation}</Code>
        </ChangeBase>
      )
    case `DIRECTIVE_LOCATION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Directive <Code>@{change.meta.directiveName}</Code> can no longer be used on{' '}
          <Code>{change.meta.removedDirectiveLocation}</Code>
        </ChangeBase>
      )
  }
}
