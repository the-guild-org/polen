import { Api } from '#api/iso'
import { Lifecycles } from '#lib/lifecycles/$'
import { Badge, Box, Heading, Text } from '@radix-ui/themes'
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
  const typeLifecycle = lifecycle ? Lifecycles.getTypeLifecycle(lifecycle, data.name) : null
  const addedDate = lifecycle ? Lifecycles.getTypeAddedDate(lifecycle, data.name) : null
  const removedDate = lifecycle ? Lifecycles.getTypeRemovedDate(lifecycle, data.name) : null
  const isAvailable = lifecycle ? Lifecycles.isTypeCurrentlyAvailable(lifecycle, data.name) : true

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
