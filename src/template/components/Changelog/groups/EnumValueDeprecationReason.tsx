import type { GraphqlChange } from '#lib/graphql-change'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const EnumValueDeprecationReason: React.FC<{ change: GraphqlChange.Group.EnumValueDeprecationReason }> = (
  { change },
) => {
  switch (change.type) {
    case `ENUM_VALUE_DEPRECATION_REASON_ADDED`:
      return (
        <ChangeBase change={change}>
          Deprecated enum value <Code>{change.meta.enumValueName}</Code> on <Code>{change.meta.enumName}</Code>
          {change.meta.addedValueDeprecationReason && <>: "{change.meta.addedValueDeprecationReason}"</>}
        </ChangeBase>
      )
    case `ENUM_VALUE_DEPRECATION_REASON_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed deprecation from enum value <Code>{change.meta.enumValueName}</Code> on{' '}
          <Code>{change.meta.enumName}</Code>
        </ChangeBase>
      )
    case `ENUM_VALUE_DEPRECATION_REASON_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed deprecation reason for enum value <Code>{change.meta.enumValueName}</Code> on{' '}
          <Code>{change.meta.enumName}</Code>
        </ChangeBase>
      )
  }
}
