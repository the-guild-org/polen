import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { GrafaidOld } from '#lib/grafaid-old'
import { Lifecycles } from '#lib/lifecycles/$'
import type { BoxProps } from '@radix-ui/themes'
import { Badge, Box, Text } from '@radix-ui/themes'
import { useSchema } from '../contexts/GraphqlLifecycleContext.js'
import { ArgumentListAnnotation } from './ArgumentListAnnotation.js'
import { DeprecationReason } from './DeprecationReason.js'
import { Description } from './Description.js'
import { SinceBadge } from './SinceBadge.js'
import { TypeAnnotation } from './TypeAnnotation.js'

export const Field: React.FC<
  BoxProps & {
    data: GrafaidOld.GraphQLField
    parentTypeName?: string
  }
> = ({ data, parentTypeName, ...boxProps }) => {
  const { schema, lifecycles } = useSchema()

  const argumentList = GrafaidOld.isOutputField(data)
    ? <ArgumentListAnnotation field={data} />
    : null

  // Get field lifecycle information if available
  const since = parentTypeName
    ? Lifecycles.getFieldSince(lifecycles, parentTypeName, data.name, schema)
    : null
  const removedDate = parentTypeName
    ? Lifecycles.getFieldRemovedDate(lifecycles, parentTypeName, data.name, schema)
    : null

  return (
    <Box {...boxProps} id={data.name}>
      <Description data={data} />
      <DeprecationReason data={data} />
      <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Text weight='medium'>{data.name}</Text>
        {since && <SinceBadge since={since} />}
        {removedDate && (
          <Badge color='red' variant='soft' size='1'>
            Removed {Api.Schema.dateToVersionString(removedDate)}
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
