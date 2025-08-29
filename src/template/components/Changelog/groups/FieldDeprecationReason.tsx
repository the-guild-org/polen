import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldDeprecationReason: React.FC<{ change: any }> = (
  { change },
) => {
  switch (change._tag) {
    case `FIELD_DEPRECATION_REASON_ADDED`:
      return (
        <ChangeBase change={change}>
          Added deprecation reason to field <Code>{change.fieldName}</Code> on <Code>{change.typeName}</Code>
          {change.reason && <>: "{change.reason}"</>}
        </ChangeBase>
      )
    case `FIELD_DEPRECATION_REASON_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed deprecation reason from field <Code>{change.fieldName}</Code> on <Code>{change.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_DEPRECATION_REASON_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed deprecation reason for field <Code>{change.fieldName}</Code> on <Code>{change.typeName}</Code> from
          {' '}
          <Code>{change.oldReason}</Code> to <Code>{change.newReason}</Code>
        </ChangeBase>
      )
  }
}
