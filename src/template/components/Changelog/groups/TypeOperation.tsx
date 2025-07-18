import type { GraphqlChange } from '#lib/graphql-change'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const TypeOperation: React.FC<{ change: GraphqlChange.Group.TypeOperation }> = ({ change }) => {
  switch (change.type) {
    case `TYPE_ADDED`:
      return (
        <ChangeBase change={change}>
          Added type <Code>{change.meta.addedTypeName}</Code>
        </ChangeBase>
      )
    case `TYPE_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed type <Code>{change.meta.removedTypeName}</Code>
        </ChangeBase>
      )
    case `TYPE_KIND_CHANGED`:
      return (
        <ChangeBase change={change}>
          Changed type <Code>{change.meta.typeName}</Code> from {change.meta.oldTypeKind} to {change.meta.newTypeKind}
        </ChangeBase>
      )
  }
}
