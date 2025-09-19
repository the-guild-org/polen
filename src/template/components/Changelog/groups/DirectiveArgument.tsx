import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type DirectiveArgumentChange =
  | typeof Change.DirectiveArgumentDefaultValueChanged.Type
  | typeof Change.DirectiveArgumentTypeChanged.Type

interface DirectiveArgumentProps {
  change: DirectiveArgumentChange
}

export const DirectiveArgument: React.FC<DirectiveArgumentProps> = ({ change }) => {
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
