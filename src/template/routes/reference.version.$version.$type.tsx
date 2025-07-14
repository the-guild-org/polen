import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { useParams } from 'react-router'
import { MissingSchema } from '../components/MissingSchema.js'
import { NamedType } from '../components/NamedType.js'
import type { reference } from './reference.js'
import { referenceVersion$version$type$field } from './reference.version.$version.$type.$field.js'

const Component = () => {
  const params = useParams() as { type: string; version: string }

  const data = useLoaderData<typeof reference.loader>(`reference`)
  if (!data.schema) {
    return <MissingSchema />
  }

  const type = data.schema.getType(params.type)
  if (!type) {
    return <div>Type not found: {params.type}</div>
  }

  return <NamedType data={type} />
}

export const referenceVersion$version$type = createRoute({
  id: `reference-version-type`,
  path: `:type`,
  Component,
  children: [referenceVersion$version$type$field],
})
