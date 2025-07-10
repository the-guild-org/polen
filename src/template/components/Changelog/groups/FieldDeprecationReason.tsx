import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldDeprecationReason: React.FC<{ change: GraphqlChange.Group.FieldDeprecationReason }> = (
  { change },
) => {
  switch (change.type) {
    case `FIELD_DEPRECATION_REASON_ADDED`:
      return (
        <ChangeBase change={change}>
          Added deprecation reason to field <Code>{change.meta.fieldName}</Code> on <Code>{change.meta.typeName}</Code>
          {change.meta.addedDeprecationReason && <>: "{change.meta.addedDeprecationReason}"</>}
        </ChangeBase>
      )
    case `FIELD_DEPRECATION_REASON_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed deprecation reason from field <Code>{change.meta.fieldName}</Code> on{' '}
          <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_DEPRECATION_REASON_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed deprecation reason for field <Code>{change.meta.fieldName}</Code> on{' '}
          <Code>{change.meta.typeName}</Code> from <Code>{change.meta.oldDeprecationReason}</Code> to{' '}
          <Code>{change.meta.newDeprecationReason}</Code>
        </ChangeBase>
      )
  }
}
