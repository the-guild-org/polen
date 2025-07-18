import { Grafaid } from '#lib/grafaid'
import { Box } from '@radix-ui/themes'
import type { FC } from 'react'
import { Field } from './Field.js'

export interface Props {
  data: Grafaid.Schema.TypesLike.Named
  parentTypeName?: string
}

export const FieldList: FC<Props> = ({ data, parentTypeName }) => {
  if (!Grafaid.Schema.TypesLike.isFielded(data)) return null

  const fields = Grafaid.Schema.NodesLike.getFields(data)
  if (fields.length === 0) return null

  return (
    <Box>
      {fields.map(field => (
        <Field
          mt='3'
          key={field.name}
          data={field}
          parentTypeName={parentTypeName ?? data.name}
        />
      ))}
    </Box>
  )
}
