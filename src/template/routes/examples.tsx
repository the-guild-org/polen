import type { Content } from '#api/content/$'
import { Catalog } from '#lib/catalog'
import { route } from '#lib/react-router-effect/route'
import { Box, Flex, Heading, Section, Text } from '@radix-ui/themes'
import { Str } from '@wollybeard/kit'
import { highlight } from 'codehike/code'
import * as React from 'react'
import { useParams } from 'react-router'
import { examplesCatalog } from 'virtual:polen/project/examples'
import { GraphQLInteractive } from '../components/GraphQLInteractive/GraphQLInteractive.js'
import { Sidebar } from '../components/sidebar/Sidebar.js'
import { catalog } from '../data/catalog.js'

const Component = () => {
  const { exampleId } = useParams<{ exampleId?: string }>()
  const [highlightedExample, setHighlightedExample] = React.useState<any>(null)

  const schema = catalog && Catalog.getLatestSchema(catalog)?.definition

  // If no examples, show message
  if (!examplesCatalog || !examplesCatalog.examples || examplesCatalog.examples.length === 0) {
    return (
      <Section size='3'>
        <Box style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <Heading size='6' mb='4'>Examples</Heading>
          <Text>No examples available yet. Add GraphQL files to the /examples directory to see them here.</Text>
        </Box>
      </Section>
    )
  }

  // Find the selected example or default to first
  const selectedExample = exampleId
    ? examplesCatalog.examples.find((e: any) => e.name === exampleId)
    : examplesCatalog.examples[0]

  if (!selectedExample) {
    return (
      <Section size='3'>
        <Box style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <Heading size='6' mb='4'>Example Not Found</Heading>
          <Text>The requested example could not be found.</Text>
        </Box>
      </Section>
    )
  }

  // Create sidebar data from examples
  const sidebarData: Content.ItemLink[] = examplesCatalog.examples.map((example: any) => {
    return {
      type: 'ItemLink',
      title: Str.Case.title(example.name),
      pathExp: example.name,
    }
  })

  // Highlight the selected example code
  React.useEffect(() => {
    const highlightCode = async () => {
      if (!selectedExample?.document) return

      const highlighted = await highlight(
        { value: selectedExample.document, lang: 'graphql', meta: 'interactive' },
        { theme: 'github-light' },
      )
      setHighlightedExample(highlighted)
    }

    if (selectedExample) {
      highlightCode()
    }
  }, [selectedExample])

  // Check if this is a versioned example (for now just check if document contains version comment)
  const isVersioned = selectedExample?.document?.includes('# Version:')
    || selectedExample?.document?.includes('// Version:') || false

  return (
    <Flex gap='0' style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box
        style={{
          width: '250px',
          borderRight: '1px solid var(--gray-a5)',
          padding: '1rem',
          overflowY: 'auto',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <Heading size='4' mb='4' style={{ paddingLeft: '1rem' }}>Examples</Heading>
        <Sidebar data={sidebarData} basePath='/examples' />
      </Box>

      {/* Main content */}
      <Box style={{ flex: 1, padding: '2rem', maxWidth: '900px' }}>
        <Heading size='6' mb='2'>{Str.Case.title(selectedExample.name)}</Heading>

        {isVersioned
          ? (
            <Box mb='4'>
              <Text color='orange' size='2'>
                ⚠️ Versioned example (TODO: Version selector coming soon)
              </Text>
            </Box>
          )
          : null}

        {highlightedExample && schema
          ? (
            <GraphQLInteractive
              codeblock={highlightedExample}
              schema={schema}
            />
          )
          : highlightedExample
          ? (
            <GraphQLInteractive
              codeblock={highlightedExample}
            />
          )
          : <Text>Loading example...</Text>}
      </Box>
    </Flex>
  )
}

export const examplesRoute = route({
  path: 'examples',
  Component,
  children: [
    {
      path: ':exampleId',
      Component,
    },
  ],
})
