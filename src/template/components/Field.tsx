import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { GrafaidOld } from '#lib/grafaid-old'
import { GraphQLPath } from '#lib/graphql-path'
import { Lifecycles } from '#lib/lifecycles/$'
import type { BoxProps } from '@radix-ui/themes'
import { Badge, Box, Text } from '@radix-ui/themes'
import { useGraphqlLifecycle } from '../contexts/GraphqlLifecycleContext.js'
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
  const { lifecycle, currentVersion } = useGraphqlLifecycle()

  const argumentList = GrafaidOld.isOutputField(data)
    ? <ArgumentListAnnotation field={data} />
    : null

  // Get field lifecycle information if available
  let fieldLifecycle = null
  let addedDate = null
  let removedDate = null
  let isAvailable = true

  if (lifecycle && parentTypeName) {
    fieldLifecycle = Lifecycles.getFieldLifecycle(lifecycle, parentTypeName, data.name)
    if (fieldLifecycle) {
      addedDate = Lifecycles.getFieldAddedDate(lifecycle, parentTypeName, data.name)
      removedDate = Lifecycles.getFieldRemovedDate(lifecycle, parentTypeName, data.name)
      isAvailable = Lifecycles.isFieldCurrentlyAvailable(lifecycle, parentTypeName, data.name)
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
