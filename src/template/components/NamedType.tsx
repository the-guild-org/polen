import { Api } from '#api/iso'
import { SchemaLifecycle } from '#lib/schema-lifecycle'
import { Badge, Box, Heading, Text } from '@radix-ui/themes'
import { type GraphQLNamedType } from 'graphql'
import type { FC } from 'react'
import { FieldListSection } from './FieldListSection.js'
import { Markdown } from './Markdown.js'

export interface Props {
  data: GraphQLNamedType
  lifecycle: SchemaLifecycle.SchemaLifecycle | null
  currentVersion: string
}

export const NamedType: FC<Props> = ({ data, lifecycle, currentVersion }) => {
  const description = data.description
    ? (
      <Text as='div' color='gray'>
        <Markdown>{data.description}</Markdown>
      </Text>
    )
    : null

  // Get lifecycle information for this type
  const typeLifecycle = lifecycle ? SchemaLifecycle.getTypeLifecycle(lifecycle, data.name) : null
  const addedDate = lifecycle ? SchemaLifecycle.getTypeAddedDate(lifecycle, data.name) : null
  const removedDate = lifecycle ? SchemaLifecycle.getTypeRemovedDate(lifecycle, data.name) : null
  const isAvailable = lifecycle ? SchemaLifecycle.isTypeCurrentlyAvailable(lifecycle, data.name) : true

  return (
    <Box>
      <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Heading size='8'>{data.name}</Heading>
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
      {description}
      <FieldListSection data={data} />
    </Box>
  )
}
