import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldDeprecation: React.FC<{ change: GraphqlChange.Group.FieldDeprecation }> = ({ change }) => {
  switch (change.type) {
    case `FIELD_DEPRECATION_ADDED`:
      return (
        <ChangeBase change={change}>
          Deprecated field <Code>{change.meta.fieldName}</Code> on <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_DEPRECATION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed deprecation from field <Code>{change.meta.fieldName}</Code> on <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
  }
}
