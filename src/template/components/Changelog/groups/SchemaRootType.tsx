import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const SchemaRootType: React.FC<{ change: GraphqlChange.Group.SchemaRootType }> = ({ change }) => {
  switch (change.type) {
    case `SCHEMA_QUERY_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Schema query root type changed from <Code>{change.meta.oldQueryTypeName}</Code> to{' '}
          <Code>{change.meta.newQueryTypeName}</Code>
        </ChangeBase>
      )
    case `SCHEMA_MUTATION_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Schema mutation root type changed from <Code>{change.meta.oldMutationTypeName || `null`}</Code> to{' '}
          <Code>{change.meta.newMutationTypeName || `null`}</Code>
        </ChangeBase>
      )
    case `SCHEMA_SUBSCRIPTION_TYPE_CHANGED`:
      return (
        <ChangeBase change={change}>
          Schema subscription root type changed from <Code>{change.meta.oldSubscriptionTypeName || `null`}</Code> to
          {' '}
          <Code>{change.meta.newSubscriptionTypeName || `null`}</Code>
        </ChangeBase>
      )
  }
}
