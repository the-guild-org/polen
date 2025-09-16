import { Code } from '@radix-ui/themes'
import { Change as GraphqlChange } from 'graphql-kit'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldDescription: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `FIELD_DESCRIPTION_ADDED`:
      return (
        <ChangeBase change={change}>
          Added description to field <Code>{change.fieldName}</Code> on <Code>{change.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_DESCRIPTION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed description from field <Code>{change.fieldName}</Code> on <Code>{change.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_DESCRIPTION_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed description for field <Code>{change.fieldName}</Code> on <Code>{change.typeName}</Code>
        </ChangeBase>
      )
  }
}
