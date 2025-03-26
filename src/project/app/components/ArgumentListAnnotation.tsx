import type { FC } from 'react'
import type { GraphQLField } from 'graphql'
import { Box, Text } from '@radix-ui/themes'
import { ArgumentAnnotation } from './ArgumentAnnotation'
import { Grafaid } from '../../../lib/grafaid'
import { FieldList } from './FieldList'

export interface Props {
  field: GraphQLField<any, any>
}

export const ArgumentListAnnotation: FC<Props> = ({ field }) => {
  if (field.args.length === 0) return null

  const inputObject = Grafaid.getIAP(field)
  const inputObjectFields = inputObject
    ? (
      <Box pl="3" style={{ borderLeft: `1px solid var(--gray-6)` }}>
        <FieldList data={inputObject} />
      </Box>
    )
    : null

  return (
    <>
      <Text>(</Text>
      <Box ml="2">
        {field.args.map(arg => <ArgumentAnnotation key={arg.name} data={arg} />)}
        {inputObjectFields}
      </Box>
      <Text>)</Text>
    </>
  )
}
