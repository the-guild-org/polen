import { createRoute } from '../../lib/react-router-helpers.js'
import { useParams, useRouteLoaderData } from 'react-router'
import type { reference } from './reference.jsx'
import { buildASTSchema } from 'graphql'
import { NamedType } from '../components/NamedType.jsx'

const Component = () => {
  const params = useParams()
  const data = useRouteLoaderData<typeof reference.loader>(`/reference`)
  // const data = reference$type.parentRoute.useLoaderData()
  const schema = buildASTSchema(data.documentNode)
  const type = schema.getType(params.type)
  if (!type) return `Could not find type ${params.type}`
  return <NamedType data={type} />
}

export const reference$type = createRoute({
  path: `:type`,
  Component,
})
