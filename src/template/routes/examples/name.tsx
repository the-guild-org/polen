import { Example } from '#api/examples/schemas/example/example'
import { Catalog } from '#lib/catalog/$'
import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Version } from '#lib/version/$'
import { Box, Heading } from '@radix-ui/themes'
import { Str } from '@wollybeard/kit'
import { Array, Option } from 'effect'
import { useSearchParams } from 'react-router'
import * as ExamplesModule from 'virtual:polen/project/examples'
import { examplesCatalog } from 'virtual:polen/project/examples'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { GraphQLDocument } from '../../components/GraphQLDocument.js'
import { MdxProvider } from '../../providers/mdx.js'

export const NameSchema = Example

// ============================================================================
// Loader
// ============================================================================

export const nameLoader = async ({ params }: any) => {
  const { name } = params

  if (!name) {
    throw new Response('Not Found', { status: 404 })
  }

  // Check if the example exists
  const exampleOption = Array.findFirst(examplesCatalog.examples, (e) => e.name === name)
  if (Option.isNone(exampleOption)) {
    throw new Response('Not Found', { status: 404 })
  }
  const example = exampleOption.value

  return example
}

// ============================================================================
// Component
// ============================================================================

const Component = () => {
  const example = useLoaderData(NameSchema)
  const [searchParams] = useSearchParams()

  // Parse version from query parameter if present
  const versionParam = searchParams.get('version')
  const selectedVersion = versionParam
    ? Version.decodeSync(versionParam)
    : undefined

  const DescriptionComponent = (ExamplesModule as any)[`DescriptionComponent_${example.name.replace(/-/g, '_')}`]

  return (
    <>
      <Heading size='6' mb='4'>{Str.Case.title(example.name)}</Heading>
      {DescriptionComponent && (
        <Box mb='4'>
          <MdxProvider schema={schemasCatalog && Catalog.getLatest(schemasCatalog).definition}>
            <DescriptionComponent />
          </MdxProvider>
        </Box>
      )}
      <GraphQLDocument
        document={example.document}
        schemaCatalog={schemasCatalog ?? undefined}
        selectedVersionCoverage={selectedVersion}
      />
    </>
  )
}

// ============================================================================
// Export
// ============================================================================

export const nameRoute = route({
  path: ':name',
  schema: NameSchema,
  loader: nameLoader,
  Component,
})
