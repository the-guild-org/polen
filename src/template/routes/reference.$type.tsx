import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { useParams } from 'react-router'
import { MissingSchema } from '../components/MissingSchema.tsx'
import { NamedType } from '../components/NamedType.tsx'
import type { reference } from './reference.tsx'

const Component = () => {
  const params = useParams() as { type: string }

  const data = useLoaderData<typeof reference.loader>(`reference`)
  if (!data.schema) {
    return <MissingSchema />
  }

  const type = data.schema.getType(params.type)
  if (!type) {
    return `Could not find type ${params.type}`
  }

  return <NamedType data={type} />
}

export const reference$type = createRoute({
  path: `:type`,
  Component,
})
