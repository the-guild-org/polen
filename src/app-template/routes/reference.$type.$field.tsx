import { buildASTSchema } from 'graphql'
import { Grafaid } from '../../lib/grafaid/index.js'
import { Field } from '../components/Field.jsx'
import { createRoute } from '../../lib/react-router-helpers.js'
import { useParams, useRouteLoaderData } from 'react-router'
import type { reference } from './reference.jsx'

const Component = () => {
  const params = useParams()
  const data = useRouteLoaderData<typeof reference.loader>(`/reference`)
  const schema = buildASTSchema(data.documentNode)
  const type = schema.getType(params.type)
  if (!type) return `Could not find type ${params.type}`
  if (!Grafaid.isTypeWithFields(type)) return `Type ${params.type} does not have fields`
  const fields = type.getFields()
  const field = fields[params.field]
  if (!field) return `Could not find field ${params.field} on type ${params.type}`
  return <Field data={field} />
}

export const reference$type$field = createRoute({
  path: `:type/:field`,
  Component,
})
