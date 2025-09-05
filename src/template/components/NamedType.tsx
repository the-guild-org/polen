import { Api } from '#api/iso'
import { Lifecycles } from '#lib/lifecycles/$'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
import { Badge, Box, Heading, Link, Text } from '@radix-ui/themes'
import { HashSet, Match } from 'effect'
import { type GraphQLNamedType } from 'graphql'
import type { FC } from 'react'
import { useSchema } from '../contexts/GraphqlLifecycleContext.js'
import { useExamplesForType } from '../hooks/use-examples.js'
import { ExampleLink } from './ExampleLink.js'
import { FieldListSection } from './FieldListSection.js'
import { TypeLink } from './graphql/graphql.js'
import { Markdown } from './Markdown.js'

export interface Props {
  data: GraphQLNamedType
}

export const NamedType: FC<Props> = ({ data }) => {
  const { schema, lifecycles } = useSchema()

  const description = data.description
    ? (
      <Text as='div' color='gray'>
        <Markdown>{data.description}</Markdown>
      </Text>
    )
    : null

  // Get lifecycle information for this type
  const since = Lifecycles.getTypeSince(lifecycles, data.name, schema)
  const removedDate = Lifecycles.getTypeRemovedDate(lifecycles, data.name, schema)

  // Get examples that use this type
  const currentVersion = Schema.Versioned.is(schema)
    ? schema.version
    : null
  const examples = useExamplesForType(data.name, currentVersion)

  return (
    <Box>
      <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Heading size='8'>
          <TypeLink type={data} />
        </Heading>
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
      {description}
      <FieldListSection data={data} />
      {HashSet.size(examples) > 0 && (
        <Box mt='4'>
          <Heading size='4' mb='2'>Used in Examples</Heading>
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[...examples].map((exampleRef) => (
              <ExampleLink
                key={`${exampleRef.name}-${Version.encodeSync(exampleRef.version)}`}
                exampleRef={exampleRef}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
