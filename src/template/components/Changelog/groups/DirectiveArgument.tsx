import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveArgument: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `DIRECTIVE_ARGUMENT_DEFAULT_VALUE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed default value for directive <Code>@{change.directiveName}</Code> argument{' '}
          <Code>{change.argumentName}</Code>
        </ChangeBase>
      )
    case `DIRECTIVE_ARGUMENT_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed directive <Code>@{change.directiveName}</Code> argument <Code>{change.argumentName}</Code> type from
          {' '}
          <Code>{change.oldType}</Code> to <Code>{change.newType}</Code>
        </ChangeBase>
      )
  }
}
