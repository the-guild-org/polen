import { Example } from '#api/examples/schemas/example/example'
import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Heading } from '@radix-ui/themes'
import { Str } from '@wollybeard/kit'
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

  return (
    <>
      <Heading size='6' mb='4'>{Str.Case.title(example.name)}</Heading>
      <GraphQLDocument
        document={example.document}
        schemaCatalog={schemasCatalog || undefined}
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
