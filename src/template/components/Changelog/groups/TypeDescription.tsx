import { Change } from 'graphql-kit'
import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

type TypeDescriptionChange =
  | typeof Change.TypeDescriptionAdded.Type
  | typeof Change.TypeDescriptionRemoved.Type
  | typeof Change.TypeDescriptionChanged.Type

interface TypeDescriptionProps {
  change: TypeDescriptionChange
}

export const TypeDescription: React.FC<TypeDescriptionProps> = ({ change }) => {
  switch (change._tag) {
    case `TYPE_DESCRIPTION_ADDED`:
      return (
        <ChangeBase change={change}>
          Added description to type <Code>{change.name}</Code>
        </ChangeBase>
      )
    case `TYPE_DESCRIPTION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed description from type <Code>{change.name}</Code>
        </ChangeBase>
      )
    case `TYPE_DESCRIPTION_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed description for type <Code>{change.name}</Code>
        </ChangeBase>
      )
  }
}
