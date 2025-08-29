import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveDescription: React.FC<{ change: any }> = ({ change }) => {
  return (
    <ChangeBase change={change}>
      Changed description for directive <Code>@{change.name}</Code>
    </ChangeBase>
  )
}
