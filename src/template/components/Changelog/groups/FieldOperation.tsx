import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldOperation: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `FIELD_ADDED`:
      return (
        <ChangeBase change={change}>
          Added field <Code>{change.fieldName}</Code> to <Code>{change.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed field <Code>{change.fieldName}</Code> from <Code>{change.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed field <Code>{change.fieldName}</Code> type from <Code>{change.oldType}</Code> to{' '}
          <Code>{change.newType}</Code> on <Code>{change.typeName}</Code>
        </ChangeBase>
      )
  }
}
