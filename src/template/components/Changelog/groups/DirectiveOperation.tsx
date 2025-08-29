import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveOperation: React.FC<{ change: any }> = ({ change }) => {
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
