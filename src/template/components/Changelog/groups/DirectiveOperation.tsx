import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveOperation: React.FC<{ change: GraphqlChange.Group.DirectiveOperation }> = ({ change }) => {
  switch (change.type) {
    case `DIRECTIVE_ADDED`:
      return (
        <ChangeBase change={change}>
          Added directive <Code>@{change.meta.addedDirectiveName}</Code>
        </ChangeBase>
      )
    case `DIRECTIVE_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed directive <Code>@{change.meta.removedDirectiveName}</Code>
        </ChangeBase>
      )
  }
}
