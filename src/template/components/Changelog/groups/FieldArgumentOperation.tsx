import type { GraphqlChange } from '#lib/graphql-change/index'
import { Code } from '@radix-ui/themes'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const FieldArgumentOperation: React.FC<{ change: GraphqlChange.Group.FieldArgumentOperation }> = (
  { change },
) => {
  switch (change.type) {
    case `FIELD_ARGUMENT_ADDED`:
      return (
        <ChangeBase change={change}>
          Added argument <Code>{change.meta.addedArgumentName}</Code> to field <Code>{change.meta.fieldName}</Code> on
          {' '}
          <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
    case `FIELD_ARGUMENT_REMOVED`:
      return (
        <ChangeBase change={change}>
          Removed argument <Code>{change.meta.removedFieldArgumentName}</Code> from field{' '}
          <Code>{change.meta.fieldName}</Code> on <Code>{change.meta.typeName}</Code>
        </ChangeBase>
      )
  }
}
