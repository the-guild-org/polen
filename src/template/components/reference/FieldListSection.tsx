import type { React } from '#dep/react/index'
import { Box, Heading } from '@radix-ui/themes'
import type { GraphQLNamedType } from 'graphql'
import { Grafaid } from 'graphql-kit'
import { GrafaidOld } from 'graphql-kit'
import { useAlignedColumns } from '../../hooks/useAlignedColumns.js'
import { FieldList } from './FieldList.js'

export const FieldListSection: React.FC<{ data: GraphQLNamedType }> = ({ data }) => {
  if (!Grafaid.Schema.TypesLike.isFielded(data)) return null

  const fields = Grafaid.Schema.NodesLike.getFields(data)
  if (fields.length === 0) return null

  // Calculate the maximum argument name width across ALL fields of this type
  const allArguments = fields.flatMap(field => GrafaidOld.isOutputField(field) ? field.args : [])
  const argumentNameWidth = useAlignedColumns(allArguments, arg => arg.name)

  return (
    <Box>
      <Heading size='5' mb='4' weight='medium'>Fields</Heading>
      <FieldList
        data={data}
        parentTypeName={data.name}
        argumentNameWidth={argumentNameWidth}
      />
    </Box>
  )
}
