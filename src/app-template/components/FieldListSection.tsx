import type { FC } from 'react'
import type { GraphQLNamedType } from 'graphql'
import { Box, Heading } from '@radix-ui/themes'
import { Grafaid } from '../../lib/grafaid/index.js'
import { FieldList } from './FieldList.jsx'

export interface Props {
  data: GraphQLNamedType
}

export const FieldListSection: FC<Props> = ({ data }) => {
  if (!Grafaid.isTypeWithFields(data)) return null

  const fields = Grafaid.getFields(data)
  if (fields.length === 0) return null

  return (
    <Box>
      <Heading>Fields</Heading>
      <FieldList data={data} />
    </Box>
  )
}
