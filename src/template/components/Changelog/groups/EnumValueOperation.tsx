import { Code } from '@radix-ui/themes'
import { Change as GraphqlChange } from 'graphql-kit'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const EnumValueOperation: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `ENUM_VALUE_ADDED`:
      return (
        <ChangeBase change={change}>
          Added value <Code>{change.value}</Code> to enum <Code>{change.enumName}</Code>
        </ChangeBase>
      )
    case `ENUM_VALUE_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed value <Code>{change.value}</Code> from enum <Code>{change.enumName}</Code>
        </ChangeBase>
      )
  }
}
