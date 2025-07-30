import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const TypeDescription: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `TYPE_DESCRIPTION_ADDED`:
      return (
        <ChangeBase change={change}>
          Added description to type <Code>{change.name}</Code>
        </ChangeBase>
      )
    case `TYPE_DESCRIPTION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed description from type <Code>{change.name}</Code>
        </ChangeBase>
      )
    case `TYPE_DESCRIPTION_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed description for type <Code>{change.name}</Code>
        </ChangeBase>
      )
  }
}
