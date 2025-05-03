import type { DocumentNode } from 'graphql'
import { GrafaidOld } from '#lib/grafaid-old/index.js'
import { Field } from '../components/Field.jsx'
import { createRoute } from '#lib/react-router-helpers.js'
import { useParams, useRouteLoaderData } from 'react-router'
import type { reference } from './reference.jsx'
import { getSchema } from '../utilities/getSchema.js'

const Component = () => {
  // eslint-disable-next-line
  const params = useParams() as any
  const data = useRouteLoaderData<typeof reference.loader>(`/reference`) as {
    documentNode: DocumentNode,
  }
  const schema = getSchema(data.documentNode)
  // eslint-disable-next-line
  const type = schema.getType(params.type)
  // eslint-disable-next-line
  if (!type) return `Could not find type ${params.type}`
  // eslint-disable-next-line
  if (!GrafaidOld.isTypeWithFields(type)) return `Type ${params.type} does not have fields`
  const fields = type.getFields()
  // eslint-disable-next-line
  const field = fields[params.field]
  // eslint-disable-next-line
  if (!field) return `Could not find field ${params.field} on type ${params.type}`
  return <Field data={field} />
}

export const reference$type$field = createRoute({
  path: `:type/:field`,
  Component,
})
