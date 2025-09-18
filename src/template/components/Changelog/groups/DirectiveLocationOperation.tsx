import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type DirectiveLocationOperationChange =
  | typeof Change.DirectiveLocationAdded.Type
  | typeof Change.DirectiveLocationRemoved.Type

interface DirectiveLocationOperationProps {
  change: DirectiveLocationOperationChange
}

export const DirectiveLocationOperation: React.FC<DirectiveLocationOperationProps> = (
  { change },
) => {
  switch (change._tag) {
    case `DIRECTIVE_LOCATION_ADDED`:
      return (
        <ChangeBase change={change}>
          Directive <Code>@{change.name}</Code> can now be used on <Code>{change.location}</Code>
        </ChangeBase>
      )
    case `DIRECTIVE_LOCATION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Directive <Code>@{change.name}</Code> can no longer be used on <Code>{change.location}</Code>
        </ChangeBase>
      )
  }
}
