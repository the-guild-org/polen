import { Code } from '@radix-ui/themes'
import { Change as GraphqlChange } from 'graphql-kit'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveArgumentOperation: React.FC<{ change: any }> = (
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
