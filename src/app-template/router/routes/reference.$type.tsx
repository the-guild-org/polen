import { createRoute } from '@tanstack/react-router'
import { buildASTSchema } from 'graphql'
import { referenceIndex } from './reference.index.jsx'
import { NamedType } from '../../components/NamedType.jsx'

const component = () => {
  const params = reference$type.useParams()
  const data = reference$type.parentRoute.useLoaderData()
  const schema = buildASTSchema(data.documentNode)
  const type = schema.getType(params.type)
  if (!type) return `Could not find type ${params.type}`
  return <NamedType data={type} />
}

export const reference$type = createRoute({
  getParentRoute: () => referenceIndex,
  path: `$type`,
  component,
})
