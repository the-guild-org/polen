import { Api } from '#api/iso'
import { Badge, Box, Card, Heading, Section, Separator, Text } from '@radix-ui/themes'
import { HashSet } from 'effect'
import { type GraphQLNamedType } from 'graphql'
import { Lifecycles } from 'graphql-kit'
import { Schema } from 'graphql-kit'
import { Version } from 'graphql-kit'
import type { FC } from 'react'
import { useSchema } from '../../contexts/GraphqlLifecycleContext.js'
import { useViewMode } from '../../contexts/ViewModeContext.js'
import { useExamplesForType } from '../../hooks/use-examples.js'
import { ExampleLink } from '../ExampleLink.js'
import { TypeLink } from '../graphql/graphql.js'
import { Markdown } from '../Markdown.js'
import { FieldListSection } from './FieldListSection.js'
import { SinceBadge } from './SinceBadge.js'

export interface Props {
  data: GraphQLNamedType
}

export const NamedType: FC<Props> = ({ data }) => {
  const { schema, lifecycles } = useSchema()
  const { viewMode } = useViewMode()

  const description = data.description && viewMode === 'expanded'
    ? (
      <Text as='div' size='2' color='gray'>
        <Markdown>{data.description}</Markdown>
      </Text>
    )
    : null

  // Get lifecycle information for this type
  const since = Lifecycles.getTypeSince(lifecycles, data.name, schema)
  const removedDate = Lifecycles.getTypeRemovedDate(lifecycles, data.name, schema)

  // Only show since badge if it's NOT the initial version
  const showSinceBadge = since && since._tag !== 'initial'

  // Get examples that use this type
  const currentVersion = Schema.Versioned.is(schema)
    ? schema.version
    : null
  const examples = useExamplesForType(data.name, currentVersion)

  return (
    <Box>
      {/* Type header section */}
      <Section size='1'>
        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Heading size='7' weight='bold'>
            <TypeLink type={data} />
          </Heading>
          {showSinceBadge && <SinceBadge since={since} />}
          {removedDate && (
            <Badge color='red' variant='soft' size='1'>
              Removed {Api.Schema.dateToVersionString(removedDate)}
            </Badge>
          )}
        </Box>

        {/* Description section */}
        {description && (
          <Box mt='3'>
            {description}
          </Box>
        )}
      </Section>

      {/* Examples section with separator */}
      {HashSet.size(examples) > 0 && (
        <>
          <Separator size='4' my='4' />
          <Section size='1'>
            <Heading size='5' mb='3' weight='medium'>Used in Examples</Heading>
            <Card variant='surface'>
              <Box style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[...examples].map((exampleRef) => (
                  <ExampleLink
                    key={`${exampleRef.name}-${
                      exampleRef.version ? Version.encodeSync(exampleRef.version) : 'unversioned'
                    }`}
                    exampleRef={exampleRef}
                  />
                ))}
              </Box>
            </Card>
          </Section>
        </>
      )}

      {/* Fields section with separator */}
      <Separator size='4' my='4' />
      <Section size='1'>
        <FieldListSection data={data} />
      </Section>
    </Box>
  )
}
