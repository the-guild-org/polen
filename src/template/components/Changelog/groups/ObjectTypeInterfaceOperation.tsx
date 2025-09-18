import type React from 'react'
import { Code } from '../../ui/index.js'
import { ChangeBase } from '../ChangeBase.js'

export const ObjectTypeInterfaceOperation: React.FC<{ change: any }> = (
  { change },
) => {
  switch (change._tag) {
    case `OBJECT_TYPE_INTERFACE_ADDED`:
      return (
        <ChangeBase change={change}>
          <Code>{change.objectName}</Code> object implements <Code>{change.interfaceName}</Code> interface
        </ChangeBase>
      )
    case `OBJECT_TYPE_INTERFACE_REMOVED`:
      return (
        <ChangeBase change={change}>
          <Code>{change.objectName}</Code> object no longer implements <Code>{change.interfaceName}</Code> interface
        </ChangeBase>
      )
  }
}
