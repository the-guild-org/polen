import type { GraphqlChange } from '#lib/graphql-change'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const ObjectTypeInterfaceOperation: React.FC<{ change: GraphqlChange.Group.ObjectTypeInterfaceOperation }> = (
  { change },
) => {
  switch (change.type) {
    case `OBJECT_TYPE_INTERFACE_ADDED`:
      return (
        <ChangeBase change={change}>
          <Code>{change.meta.objectTypeName}</Code> object implements <Code>{change.meta.addedInterfaceName}</Code>{' '}
          interface
        </ChangeBase>
      )
    case `OBJECT_TYPE_INTERFACE_REMOVED`:
      return (
        <ChangeBase change={change}>
          <Code>{change.meta.objectTypeName}</Code> object no longer implements{' '}
          <Code>{change.meta.removedInterfaceName}</Code> interface
        </ChangeBase>
      )
  }
}
