import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { GrafaidOld } from '#lib/grafaid-old'
import { GraphQLPath } from '#lib/graphql-path'
import { SchemaLifecycle } from '#lib/schema-lifecycle'
import type { BoxProps } from '@radix-ui/themes'
import { Badge, Box, Text } from '@radix-ui/themes'
import { useSchemaLifecycle } from '../contexts/SchemaLifecycleContext.js'
import { ArgumentListAnnotation } from './ArgumentListAnnotation.js'
import { DeprecationReason } from './DeprecationReason.js'
import { Description } from './Description.js'
import { TypeAnnotation } from './TypeAnnotation.js'

export const Field: React.FC<
  BoxProps & {
    data: GrafaidOld.GraphQLField
    parentTypeName?: string
  }
> = ({ data, parentTypeName, ...boxProps }) => {
  const { lifecycle, currentVersion } = useSchemaLifecycle()

  const argumentList = GrafaidOld.isOutputField(data)
    ? <ArgumentListAnnotation field={data} />
    : null

  // Get field lifecycle information if available
  let fieldLifecycle = null
  let addedDate = null
  let removedDate = null
  let isAvailable = true

  if (lifecycle && parentTypeName) {
    const fieldPath = GraphQLPath.Definition.field(parentTypeName, data.name)
    fieldLifecycle = SchemaLifecycle.getFieldLifecycle(lifecycle, fieldPath)
    if (fieldLifecycle) {
      addedDate = SchemaLifecycle.getFieldAddedDate(lifecycle, fieldPath)
      removedDate = SchemaLifecycle.getFieldRemovedDate(lifecycle, fieldPath)
      isAvailable = SchemaLifecycle.isFieldCurrentlyAvailable(lifecycle, fieldPath)
    }
  }

  return (
    <Box {...boxProps} id={data.name}>
      <Description data={data} />
      <DeprecationReason data={data} />
      <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Text weight='medium'>{data.name}</Text>
        {addedDate && (
          <Badge color='green' variant='soft' size='1'>
            Added {Api.Schema.dateToVersionString(addedDate)}
          </Badge>
        )}
        {removedDate && (
          <Badge color='red' variant='soft' size='1'>
            Removed {Api.Schema.dateToVersionString(removedDate)}
          </Badge>
        )}
        {!isAvailable && (
          <Badge color='orange' variant='soft' size='1'>
            Not available in current version
          </Badge>
        )}
      </Box>
      <Text>
        {argumentList}
        :{` `}
        <TypeAnnotation type={data.type} />
      </Text>
    </Box>
  )
}
