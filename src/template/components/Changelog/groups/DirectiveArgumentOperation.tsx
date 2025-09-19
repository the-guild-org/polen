import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type DirectiveArgumentOperationChange =
  | typeof Change.DirectiveArgumentAdded.Type
  | typeof Change.DirectiveArgumentRemoved.Type

interface DirectiveArgumentOperationProps {
  change: DirectiveArgumentOperationChange
}

export const DirectiveArgumentOperation: React.FC<DirectiveArgumentOperationProps> = (
  { change },
) => {
  switch (change._tag) {
    case `DIRECTIVE_ARGUMENT_ADDED`:
      return (
        <ChangeBase change={change}>
          Added argument <Code>{change.argumentName}</Code> to directive <Code>@{change.directiveName}</Code>
        </ChangeBase>
      )
    case `DIRECTIVE_ARGUMENT_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed argument <Code>{change.argumentName}</Code> from directive <Code>@{change.directiveName}</Code>
        </ChangeBase>
      )
  }
}
