import { Grafaid } from '#lib/grafaid/index.ts'
import { Box, Heading } from '@radix-ui/themes'
import type { GraphQLNamedType } from 'graphql'
import type { FC } from 'react'
import { FieldList } from './FieldList.jsx'

export interface Props {
  data: GraphQLNamedType
}

export const FieldListSection: FC<Props> = ({ data }) => {
  if (!Grafaid.Schema.TypesLike.isFielded(data)) return null

  const fields = Grafaid.Schema.NodesLike.getFields(data)
  if (fields.length === 0) return null

  return (
    <Box>
      <Heading>Fields</Heading>
      <FieldList data={data} />
    </Box>
  )
}
