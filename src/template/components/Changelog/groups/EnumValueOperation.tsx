import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const EnumValueOperation: React.FC<{ change: GraphqlChange.Group.EnumValueOperation }> = ({ change }) => {
  switch (change.type) {
    case `ENUM_VALUE_ADDED`:
      return (
        <ChangeBase change={change}>
          Added value <Code>{change.meta.addedEnumValueName}</Code> to enum <Code>{change.meta.enumName}</Code>
        </ChangeBase>
      )
    case `ENUM_VALUE_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed value <Code>{change.meta.removedEnumValueName}</Code> from enum <Code>{change.meta.enumName}</Code>
        </ChangeBase>
      )
  }
}
