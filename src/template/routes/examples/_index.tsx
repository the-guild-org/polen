import { Catalog as ExamplesCatalog } from '#api/examples/schemas/catalog'
import { Catalog } from '#lib/catalog/$'
import { routeIndex } from '#lib/react-router-effect/react-router-effect'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Box, Code, Text } from '@radix-ui/themes'
import { redirect } from 'react-router'
import { examplesCatalog, IndexComponent } from 'virtual:polen/project/examples'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { DevelopmentTip } from '../../components/DevelopmentTip.js'
import { MdxProvider } from '../../providers/mdx.js'

// ============================================================================
// Schema
// ============================================================================

const IndexSchema = ExamplesCatalog

// ============================================================================
// Loader
// ============================================================================

const isHasExamplesIndexPage = !!IndexComponent

export const loader = async () => {
  const firstExample = examplesCatalog.examples[0]
  if (!isHasExamplesIndexPage && firstExample) {
    throw redirect(`/examples/${firstExample.name}`)
  }

  return examplesCatalog
}

// ============================================================================
// Component
// ============================================================================

const Component = () => {
  const examplesCatalog = useLoaderData(IndexSchema)
  const schema = schemasCatalog && Catalog.getLatest(schemasCatalog).definition
  const hasExamples = examplesCatalog && examplesCatalog.examples.length > 0

  // TODO: This should become a proper diagnostic viewer component that displays
  // diagnostics from the Polen diagnostic system, ensuring symmetry between
  // terminal and UI communication. The component would consume the same diagnostic
  // data that gets logged to the terminal during build/dev processes.
  const insituDiagnostic = !hasExamples && (
    <DevelopmentTip title='Examples Setup' variant='warning'>
      <Text>
        The examples section is enabled but no example files were found. To get started:
      </Text>
      <Box mt='2'>
        <Text>
          <strong>Option 1:</strong> Add <Code>.graphql</Code> or <Code>.gql</Code> files to your <Code>examples/</Code>
          {' '}
          directory
        </Text>
      </Box>
      <Box mt='1'>
        <Text>
          <strong>Option 2:</strong> If you don't need examples, disable this section in your config by setting{' '}
          <Code>examples.enabled: false</Code>
        </Text>
      </Box>
    </DevelopmentTip>
  )

  // Render index component if available
  if (IndexComponent) {
    return (
      <>
        {insituDiagnostic}
        {IndexComponent && (
          <MdxProvider schema={schema}>
            <IndexComponent />
          </MdxProvider>
        )}
      </>
    )
  }

  // Has examples but no index - shouldn't reach here due to redirect
  return null
}

// ============================================================================
// Route
// ============================================================================

export const examplesIndexRoute = routeIndex({
  schema: IndexSchema,
  loader,
  Component,
})
