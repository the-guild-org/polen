import { Code } from '@radix-ui/themes'
import { Change as GraphqlChange } from 'graphql-kit'
import type React from 'react'
import { ChangeBase } from '../ChangeBase.js'

export const DirectiveLocationOperation: React.FC<{ change: any }> = (
  { change },
) => {
  switch (change._tag) {
    case `DIRECTIVE_LOCATION_ADDED`:
      return (
        <ChangeBase change={change}>
          Directive <Code>@{change.name}</Code> can now be used on <Code>{change.location}</Code>
        </ChangeBase>
      )
    case `DIRECTIVE_LOCATION_REMOVED`:
      return (
        <ChangeBase change={change}>
          Directive <Code>@{change.name}</Code> can no longer be used on <Code>{change.location}</Code>
        </ChangeBase>
      )
  }
}
