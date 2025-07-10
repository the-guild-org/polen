import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const EnumValueDescription: React.FC<{ change: GraphqlChange.Group.EnumValueDescription }> = ({ change }) => {
  return (
    <ChangeBase change={change}>
      Changed description for enum value <Code>{change.meta.enumValueName}</Code> on <Code>{change.meta.enumName}</Code>
    </ChangeBase>
  )
}
