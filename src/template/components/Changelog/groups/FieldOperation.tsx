import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldOperation: React.FC<{ change: GraphqlChange.Group.FieldOperation }> = ({ change }) => {
  switch (change.type) {
    case `FIELD_ADDED`:
      return (
        <ChangeBase change={change}>
          Added field <Code>{change.meta.addedFieldName}</Code> to <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed field <Code>{change.meta.removedFieldName}</Code> from <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed field <Code>{change.meta.fieldName}</Code> type from <Code>{change.meta.oldFieldType}</Code> to{' '}
          <Code>{change.meta.newFieldType}</Code> on <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
  }
}
