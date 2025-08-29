import { Change as GraphqlChange } from '#lib/change/$'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const SchemaRootType: React.FC<{ change: any }> = ({ change }) => {
  switch (change._tag) {
    case `SCHEMA_QUERY_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Schema query root type changed from <Code>{change.oldType}</Code> to <Code>{change.newType}</Code>
        </ChangeBase>
      )
    case `SCHEMA_MUTATION_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Schema mutation root type changed from <Code>{change.oldType || `null`}</Code> to{' '}
          <Code>{change.newType || `null`}</Code>
        </ChangeBase>
      )
    case `SCHEMA_SUBSCRIPTION_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Schema subscription root type changed from <Code>{change.oldType || `null`}</Code> to{' '}
          <Code>{change.newType || `null`}</Code>
        </ChangeBase>
      )
  }
}
