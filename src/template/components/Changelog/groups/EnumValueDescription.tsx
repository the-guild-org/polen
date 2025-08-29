import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const EnumValueDescription: React.FC<{ change: any }> = ({ change }) => {
  return (
    <ChangeBase change={change}>
      Changed description for enum value <Code>{change.value}</Code> on <Code>{change.enumName}</Code>
    </ChangeBase>
  )
}
