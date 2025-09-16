import { Box, Flex } from '@radix-ui/themes'
import { Grafaid } from 'graphql-kit'
import { GrafaidOld } from 'graphql-kit'
import { type FC } from 'react'
import { useAlignedColumns } from '../../hooks/useAlignedColumns.js'
import { Field } from './Field.js'

export interface Props {
  data: Grafaid.Schema.TypesLike.Named
  parentTypeName?: string
  argumentNameWidth?: number
}

export const FieldList: FC<Props> = ({ data, parentTypeName, argumentNameWidth }) => {
  if (!Grafaid.Schema.TypesLike.isFielded(data)) return null

  const fields = Grafaid.Schema.NodesLike.getFields(data)
  if (fields.length === 0) return null

  // Calculate the maximum field name length for alignment using shared hook
  const fieldNameWidth = useAlignedColumns(fields, field => field.name)

  return (
    <Flex direction='column'>
      {fields.map((field, index) => {
        // Check if this field has arguments
        const hasArguments = GrafaidOld.isOutputField(field) && field.args.length > 0
        // Add extra spacing after fields with arguments
        const marginBottom = hasArguments ? '5' : '3'

        return (
          <Box key={field.name} mb={index < fields.length - 1 ? marginBottom : '0'}>
            <Field
              data={field}
              parentTypeName={parentTypeName ?? data.name}
              fieldNameWidth={fieldNameWidth}
              {...(argumentNameWidth !== undefined ? { argumentNameWidth } : {})}
            />
          </Box>
        )
      })}
    </Flex>
  )
}
