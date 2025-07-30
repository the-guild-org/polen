import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const UnionMemberOperation: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `UNION_MEMBER_ADDED`:
      return (
        <ChangeBase change={change}>
          Added <Code>{change.memberName}</Code> to union <Code>{change.unionName}</Code>
        </ChangeBase>
      )
    case `UNION_MEMBER_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed <Code>{change.memberName}</Code> from union <Code>{change.unionName}</Code>
        </ChangeBase>
      )
  }
}
