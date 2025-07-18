import type { GraphqlChange } from '#lib/graphql-change'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const TypeDescription: React.FC<{ change: GraphqlChange.Group.TypeDescription }> = ({ change }) => {
  switch (change.type) {
    case `TYPE_DESCRIPTION_ADDED`:
      return (
        <ChangeBase change={change}>
          Added description to type <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
    case `TYPE_DESCRIPTION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed description from type <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
    case `TYPE_DESCRIPTION_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed description for type <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
  }
}
