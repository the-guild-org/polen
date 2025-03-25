import { createRoute } from '@tanstack/react-router'
import { buildASTSchema } from 'graphql'
import { referenceIndex } from './reference.index'
import { Heading } from '@radix-ui/themes'

const component = () => {
  const params = reference$type$field.useParams()
  const data = reference$type$field.parentRoute.useLoaderData()
  const schema = buildASTSchema(data.documentNode)
  const type = schema.getType(params.type)
  if (!type) return `Could not find type ${params.type}`
  return <Heading>{params.field}</Heading>
}

export const reference$type$field = createRoute({
  getParentRoute: () => referenceIndex,
  path: `$type/$field`,
  component,
})
