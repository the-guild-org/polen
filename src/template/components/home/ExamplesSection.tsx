import type { Api } from '#api/$'
import { Catalog } from '#lib/catalog/$'
import { Box, Heading, Section } from '@radix-ui/themes'
import * as React from 'react'
import { Carousel } from '../Carousel.js'
import { GraphQLDocument } from '../GraphQLDocument.js'

interface ExamplesSectionProps {
  schemaCatalog?: Catalog.Catalog | undefined
  title?: string | undefined
  description?: string | undefined
  maxExamples?: number | undefined
  examples: readonly Api.Examples.Example.Example[]
}

export const ExamplesSection: React.FC<ExamplesSectionProps> = ({
  examples,
  schemaCatalog,
  title = 'API Examples',
  maxExamples = 3,
}) => {
  if (examples.length === 0) {
    return null
  }

  // Limit examples to maxExamples
  const displayExamples = examples.slice(0, maxExamples)

  return (
    <Section size='3' id='examples' style={{ overflow: 'visible' }}>
      <Box mb='4' style={{ textAlign: 'center' }}>
        <Heading size='6' mb='2'>
          {title}
        </Heading>
      </Box>

      <Carousel autoPlay={true}>
        {displayExamples.map((example) => (
          <GraphQLDocument
            style={{ height: '100%' }}
            key={example.name}
            document={example.document}
            schemaCatalog={schemaCatalog}
          />
        ))}
      </Carousel>
    </Section>
  )
}
