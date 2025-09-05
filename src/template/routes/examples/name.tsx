import { Example } from '#api/examples/schemas/example/example'
import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Version } from '#lib/version/$'
import { Heading } from '@radix-ui/themes'
import { Str } from '@wollybeard/kit'
import { useSearchParams } from 'react-router'
import { examplesCatalog } from 'virtual:polen/project/examples'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { GraphQLDocument } from '../../components/GraphQLDocument.js'

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
  const example = examplesCatalog.examples.find((e: any) => e.name === name)
  if (!example) {
    throw new Response('Not Found', { status: 404 })
  }

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

  return (
    <>
      <Heading size='6' mb='4'>{Str.Case.title(example.name)}</Heading>
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
