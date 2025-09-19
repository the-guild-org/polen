import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type FieldDeprecationChange =
  | typeof Change.FieldDeprecationAdded.Type
  | typeof Change.FieldDeprecationRemoved.Type

interface FieldDeprecationProps {
  change: FieldDeprecationChange
}

export const FieldDeprecation: React.FC<FieldDeprecationProps> = ({ change }) => {
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
