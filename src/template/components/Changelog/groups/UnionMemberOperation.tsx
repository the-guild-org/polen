import type { GraphqlChange } from '#lib/graphql-change'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const UnionMemberOperation: React.FC<{ change: GraphqlChange.Group.UnionMemberOperation }> = ({ change }) => {
  switch (change.type) {
    case `UNION_MEMBER_ADDED`:
      return (
        <ChangeBase change={change}>
          Added <Code>{change.meta.addedUnionMemberTypeName}</Code> to union <Code>{change.meta.unionName}</Code>
        </ChangeBase>
      )
    case `UNION_MEMBER_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed <Code>{change.meta.removedUnionMemberTypeName}</Code> from union <Code>{change.meta.unionName}</Code>
        </ChangeBase>
      )
  }
}
