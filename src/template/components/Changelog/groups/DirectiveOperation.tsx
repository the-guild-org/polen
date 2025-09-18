import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type DirectiveOperationChange =
  | typeof Change.DirectiveAdded.Type
  | typeof Change.DirectiveRemoved.Type

interface DirectiveOperationProps {
  change: DirectiveOperationChange
}

export const DirectiveOperation: React.FC<DirectiveOperationProps> = ({ change }) => {
  switch (change._tag) {
    case `DIRECTIVE_ADDED`:
      return (
        <ChangeBase change={change}>
          Added directive <Code>@{change.name}</Code>
        </ChangeBase>
      )
    case `DIRECTIVE_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed directive <Code>@{change.name}</Code>
        </ChangeBase>
      )
  }
}
