import { createRoute } from '#lib/react-router-helpers.js'
import { useParams, useRouteLoaderData } from 'react-router'
import type { reference } from './reference.jsx'
import type { DocumentNode } from 'graphql'
import { NamedType } from '../components/NamedType.jsx'
import { getSchema } from '../utilities/getSchema.js'

const Component = () => {
  // eslint-disable-next-line
  const params = useParams() as any
  const data = useRouteLoaderData<typeof reference.loader>(`/reference`) as {
    documentNode: DocumentNode,
  }
  // const data = reference$type.parentRoute.useLoaderData()
  const schema = getSchema(data.documentNode)
  // eslint-disable-next-line
  const type = schema.getType(params.type)
  // eslint-disable-next-line
  if (!type) return `Could not find type ${params.type}`
  return <NamedType data={type} />
}

export const reference$type = createRoute({
  path: `:type`,
  Component,
})
