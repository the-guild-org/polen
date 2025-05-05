import type { FC } from 'react'
import { Box } from '@radix-ui/themes'
import { Field } from './Field.jsx'
import { Grafaid } from '#lib/grafaid/index.js'

export interface Props {
  data: Grafaid.Schema.TypesLike.Named
}

export const FieldList: FC<Props> = ({ data }) => {
  if (!Grafaid.Schema.TypesLike.isFielded(data)) return null

  const fields = Grafaid.Schema.NodesLike.getFields(data)
  if (fields.length === 0) return null

  return (
    <Box>
      {fields.map(field => (
        <Field
          mt="3"
          key={field.name}
          data={field}
        />
      ))}
    </Box>
  )
}
