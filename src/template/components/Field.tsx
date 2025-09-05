import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { GrafaidOld } from '#lib/grafaid-old'
import { Lifecycles } from '#lib/lifecycles/$'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
import type { BoxProps } from '@radix-ui/themes'
import { Badge, Box, Link, Text } from '@radix-ui/themes'
import { Match } from 'effect'
import { useSchema } from '../contexts/GraphqlLifecycleContext.js'
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
        {since && (
          since._tag === 'initial'
            ? (
              <Badge color='blue' variant='soft' size='1'>
                Since initial version
              </Badge>
            )
            : (
              <Link
                href={Api.Schema.Routing.createChangelogUrl(
                  since.revision.date,
                  since.schema,
                )}
                style={{ textDecoration: 'none' }}
              >
                <Badge color='green' variant='soft' size='1' style={{ cursor: 'pointer' }}>
                  Added {Match.value(since.schema).pipe(
                    Match.tagsExhaustive({
                      SchemaVersioned: (s) => `${Version.encodeSync(s.version)}@${since.revision.date}`,
                      SchemaUnversioned: () => since.revision.date,
                    }),
                  )}
                </Badge>
              </Link>
            )
        )}
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
