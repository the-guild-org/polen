import type { FC } from 'react'
import type { GraphQLNamedType } from 'graphql'
import { Box } from '@radix-ui/themes'
import { Grafaid } from '../../lib/grafaid/index.js'
import { Field } from './Field.jsx'

export interface Props {
  data: GraphQLNamedType
}

export const FieldList: FC<Props> = ({ data }) => {
  if (!Grafaid.isTypeWithFields(data)) return null

  const fields = Grafaid.getFields(data)
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
