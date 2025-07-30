import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const TypeOperation: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `TYPE_ADDED`:
      return (
        <ChangeBase change={change}>
          Added type <Code>{change.name}</Code>
        </ChangeBase>
      )
    case `TYPE_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed type <Code>{change.name}</Code>
        </ChangeBase>
      )
    case `TYPE_KIND_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed type <Code>{change.name}</Code> from {change.oldKind} to {change.newKind}
        </ChangeBase>
      )
  }
}
