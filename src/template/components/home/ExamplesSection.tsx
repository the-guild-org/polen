import type { Api } from '#api/index'
import { Box, Heading, Section } from '@radix-ui/themes'
import type { GraphQLSchema } from 'graphql'
import * as React from 'react'
import { InteractiveExamples } from './InteractiveExamples.js'

interface ExamplesSectionProps {
  schema?: GraphQLSchema | undefined
  title?: string | undefined
  description?: string | undefined
  maxExamples?: number | undefined
  examples: readonly Api.Examples.Example.Example[]
}

export const ExamplesSection: React.FC<ExamplesSectionProps> = ({
  examples,
  schema,
  title = 'API Examples',
  maxExamples = 3,
}) => {
  if (examples.length === 0) {
    return null
  }

  // Limit examples to maxExamples
  const displayExamples = examples.slice(0, maxExamples)

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
