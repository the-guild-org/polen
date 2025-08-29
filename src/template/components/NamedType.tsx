import { Api } from '#api/iso'
import { Lifecycles } from '#lib/lifecycles/$'
import { Version } from '#lib/version/$'
import { Badge, Box, Heading, Link, Text } from '@radix-ui/themes'
import { type GraphQLNamedType } from 'graphql'
import type { FC } from 'react'
import { useGraphqlLifecycle } from '../contexts/GraphqlLifecycleContext.js'
import { FieldListSection } from './FieldListSection.js'
import { Markdown } from './Markdown.js'

export interface Props {
  data: GraphQLNamedType
}

export const NamedType: FC<Props> = ({ data }) => {
  const { lifecycle, currentVersion } = useGraphqlLifecycle()

  const description = data.description
    ? (
      <Text as='div' color='gray'>
        <Markdown>{data.description}</Markdown>
      </Text>
    )
    : null

  // Get lifecycle information for this type
  // Pass currentVersion to filter badges appropriately for reference docs
  const since = lifecycle ? Lifecycles.getTypeSince(lifecycle, data.name, currentVersion) : null
  const removedDate = lifecycle ? Lifecycles.getTypeRemovedDate(lifecycle, data.name, currentVersion) : null

  return (
    <Box>
      <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Heading size='8'>{data.name}</Heading>
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
                  since.schema._tag === 'SchemaVersioned' ? Version.toString(since.schema.version) : undefined,
                )}
                style={{ textDecoration: 'none' }}
              >
                <Badge color='green' variant='soft' size='1' style={{ cursor: 'pointer' }}>
                  Added {since.schema._tag === 'SchemaVersioned'
                    ? `${Version.toString(since.schema.version)}@${since.revision.date}`
                    : since.revision.date}
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
      {description}
      <FieldListSection data={data} />
    </Box>
  )
}
