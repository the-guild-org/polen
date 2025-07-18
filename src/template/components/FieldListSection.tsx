import type { React } from '#dep/react/index'
import { Grafaid } from '#lib/grafaid'
import { Box, Heading } from '@radix-ui/themes'
import type { GraphQLNamedType } from 'graphql'
import { FieldList } from './FieldList.js'

export const FieldListSection: React.FC<{ data: GraphQLNamedType }> = ({ data }) => {
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
