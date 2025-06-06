import { Grafaid } from '#lib/grafaid'
import { ReactRouterAid } from '#lib/react-router-aid'
import { useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { useParams } from 'react-router'
import { Field } from '../components/Field.jsx'
import { MissingSchema } from '../components/MissingSchema.jsx'
import type { reference } from './reference.jsx'

const Component = () => {
  const params = useParams() as { type: string; field: string }
  const data = useLoaderData<typeof reference.loader>(`reference`)
  if (!data.schema) {
    return <MissingSchema />
  }

  const type = data.schema.getType(params.type)
  if (!type) return `Could not find type ${params.type}`
  if (!Grafaid.Schema.TypesLike.isFielded(type)) {
    return `Type ${params.type} does not have fields`
  }

  const fields = type.getFields()
  const field = fields[params.field]
  if (!field) {
    return `Could not find field ${params.field} on type ${params.type}`
  }

  return <Field data={field} />
}

export const reference$type$field = ReactRouterAid.createRoute({
  path: `:type/:field`,
  Component,
})
