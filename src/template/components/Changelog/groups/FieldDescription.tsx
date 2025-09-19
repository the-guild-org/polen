import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type FieldDescriptionChange =
  | typeof Change.FieldDescriptionAdded.Type
  | typeof Change.FieldDescriptionRemoved.Type
  | typeof Change.FieldDescriptionChanged.Type

interface FieldDescriptionProps {
  change: FieldDescriptionChange
}

export const FieldDescription: React.FC<FieldDescriptionProps> = ({ change }) => {
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
