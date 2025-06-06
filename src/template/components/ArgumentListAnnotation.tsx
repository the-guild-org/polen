import { GrafaidOld } from '#lib/grafaid-old/index.ts'
import { Box, Text } from '@radix-ui/themes'
import type { GraphQLField } from 'graphql'
import type { FC } from 'react'
import { ArgumentAnnotation } from './ArgumentAnnotation.jsx'
import { FieldList } from './FieldList.jsx'

export interface Props {
  field: GraphQLField<any, any>
}

export const ArgumentListAnnotation: FC<Props> = ({ field }) => {
  if (field.args.length === 0) return null

  const inputObject = GrafaidOld.getIAP(field)
  const inputObjectFields = inputObject
    ? (
      <Box pl='3' style={{ borderLeft: `1px solid var(--gray-6)` }}>
        <FieldList data={inputObject} />
      </Box>
    )
    : null

  return (
    <>
      <Text>(</Text>
      <Box ml='2'>
        {field.args.map(arg => <ArgumentAnnotation key={arg.name} data={arg} />)}
        {inputObjectFields}
      </Box>
      <Text>)</Text>
    </>
  )
}
