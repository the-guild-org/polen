import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveArgument: React.FC<{ change: GraphqlChange.Group.DirectiveArgument }> = ({ change }) => {
  switch (change.type) {
    case `DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed default value for directive <Code>@{change.meta.directiveName}</Code> argument{' '}
          <Code>{change.meta.directiveArgumentName}</Code>
        </ChangeBase>
      )
    case `DIRECTIVE_ARGUMENT_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed directive <Code>@{change.meta.directiveName}</Code> argument{' '}
          <Code>{change.meta.directiveArgumentName}</Code> type from <Code>{change.meta.oldDirectiveArgumentType}</Code>
          {' '}
          to <Code>{change.meta.newDirectiveArgumentType}</Code>
        </ChangeBase>
      )
  }
}
