import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type EnumValueDeprecationReasonChange =
  | typeof Change.EnumValueDeprecationReasonChanged.Type
  | typeof Change.EnumValueDeprecationReasonAdded.Type
  | typeof Change.EnumValueDeprecationReasonRemoved.Type

interface EnumValueDeprecationReasonProps {
  change: EnumValueDeprecationReasonChange
}

export const EnumValueDeprecationReason: React.FC<EnumValueDeprecationReasonProps> = (
  { change },
) => {
  switch (change._tag) {
    case `ENUM_VALUE_DEPRECATION_REASON_ADDED`:
      return (
        <ChangeBase change={change}>
          Deprecated enum value <Code>{change.value}</Code> on <Code>{change.enumName}</Code>
          {change.reason && <>: "{change.reason}"</>}
        </ChangeBase>
      )
    case `ENUM_VALUE_DEPRECATION_REASON_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed deprecation from enum value <Code>{change.value}</Code> on <Code>{change.enumName}</Code>
        </ChangeBase>
      )
    case `ENUM_VALUE_DEPRECATION_REASON_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed deprecation reason for enum value <Code>{change.value}</Code> on <Code>{change.enumName}</Code>
        </ChangeBase>
      )
  }
}
