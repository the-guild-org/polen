import type { Api } from '#api/index'
import { Box, Heading, Section, Text } from '@radix-ui/themes'
import type { GraphQLSchema } from 'graphql'
import * as React from 'react'
import { InteractiveExamples } from './InteractiveExamples.js'

interface ExamplesSectionProps {
  schema?: GraphQLSchema
  title?: string
  description?: string
  maxExamples?: number
  catalog: Api.Examples.Catalog.Catalog
}

export const ExamplesSection: React.FC<ExamplesSectionProps> = ({
  catalog,
  schema,
  title = 'API Examples',
  maxExamples = 3,
}) => {
  if (catalog.examples.length === 0) {
    return null
  }

  // Limit examples to maxExamples
  const displayExamples = catalog.examples.slice(0, maxExamples)

  return (
    <Section size='3' id='examples'>
      <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Box mb='4' style={{ textAlign: 'center' }}>
          <Heading size='6' mb='2'>
            {title}
          </Heading>
        </Box>

        {schema
          ? <InteractiveExamples examples={displayExamples} schema={schema} />
          : <InteractiveExamples examples={displayExamples} />}
      </Box>
    </Section>
  )
}
