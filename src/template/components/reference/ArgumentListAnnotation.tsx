import type { GraphQLArgument, GraphQLField } from 'graphql'
import { Grafaid, GrafaidOld } from 'graphql-kit'
import type { FC } from 'react'
import { useAlignedColumns } from '../../hooks/useAlignedColumns.js'
import { Box, Flex } from '../ui/index.js'
import { ArgumentAnnotation } from './ArgumentAnnotation.js'
import { IAPIndicator } from './IAPIndicator.js'

export interface Props {
  field: GraphQLField<any, any>
  argumentNameWidth?: number
}

export const ArgumentListAnnotation: FC<Props> = ({ field, argumentNameWidth }) => {
  if (field.args.length === 0) return null

  const inputObject = GrafaidOld.getIAP(field)

  // If it's IAP, show indicator and input object's fields directly
  if (inputObject) {
    const inputFields = Grafaid.Schema.NodesLike.getFields(inputObject)
    const nameWidth = argumentNameWidth ?? useAlignedColumns(inputFields, field => field.name)

    return (
      <Box>
        <Flex direction='column' gap='2'>
          {/* Small IAP indicator */}
          <Box ml='3'>
            <IAPIndicator inputObject={inputObject} />
          </Box>

          {/* Show input object fields directly without header */}
          {inputFields.map(field => (
            <Box key={field.name} ml='3'>
              <ArgumentAnnotation
                data={{
                  name: field.name,
                  type: field.type,
                  description: field.description,
                  defaultValue: (field as any).defaultValue,
                  deprecationReason: (field as any).deprecationReason,
                } as GraphQLArgument}
                nameWidth={nameWidth}
              />
            </Box>
          ))}
        </Flex>
      </Box>
    )
  }

  // Regular non-IAP arguments
  const nameWidth = argumentNameWidth ?? useAlignedColumns([...field.args], arg => arg.name)

  return (
    <Box>
      <Flex direction='column' gap='2'>
        {field.args.map(arg => (
          <Box key={arg.name} ml='3'>
            <ArgumentAnnotation data={arg} nameWidth={nameWidth} />
          </Box>
        ))}
      </Flex>
    </Box>
  )
}
