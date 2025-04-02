import { createRoute } from '@tanstack/react-router'
import { buildASTSchema } from 'graphql'
import { referenceIndex } from './reference.index.jsx'
import { Grafaid } from '../../../lib/grafaid/index.js'
import { Field } from '../../components/Field.jsx'

const component = () => {
  const params = reference$type$field.useParams()
  const data = reference$type$field.parentRoute.useLoaderData()
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
  getParentRoute: () => referenceIndex,
  path: `$type/$field`,
  component,
})
