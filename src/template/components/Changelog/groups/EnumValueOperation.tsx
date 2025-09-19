import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type EnumValueOperationChange =
  | typeof Change.EnumValueAdded.Type
  | typeof Change.EnumValueRemoved.Type
  | typeof Change.EnumValueDeprecationAdded.Type
  | typeof Change.EnumValueDeprecationRemoved.Type

interface EnumValueOperationProps {
  change: EnumValueOperationChange
}

export const EnumValueOperation: React.FC<EnumValueOperationProps> = ({ change }) => {
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
    case `ENUM_VALUE_DEPRECATION_ADDED`:
      return (
        <ChangeBase change={change}>
          Deprecated enum value <Code>{change.value}</Code> on <Code>{change.enumName}</Code>
          {change.reason && <>: "{change.reason}"</>}
        </ChangeBase>
      )
    case `ENUM_VALUE_DEPRECATION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed deprecation from enum value <Code>{change.value}</Code> on <Code>{change.enumName}</Code>
        </ChangeBase>
      )
  }
}
