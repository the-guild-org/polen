import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldDeprecation: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `FIELD_DEPRECATION_ADDED`:
      return (
        <ChangeBase change={change}>
          Deprecated field <Code>{change.fieldName}</Code> on <Code>{change.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_DEPRECATION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed deprecation from field <Code>{change.fieldName}</Code> on <Code>{change.typeName}</Code>
        </ChangeBase>
      )
  }
}
