import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldDescription: React.FC<{ change: GraphqlChange.Group.FieldDescription }> = ({ change }) => {
  switch (change.type) {
    case `FIELD_DESCRIPTION_ADDED`:
      return (
        <ChangeBase change={change}>
          Added description to field <Code>{change.meta.fieldName}</Code> on <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_DESCRIPTION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed description from field <Code>{change.meta.fieldName}</Code> on <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_DESCRIPTION_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed description for field <Code>{change.meta.fieldName}</Code> on <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
  }
}
