import { createRoute } from '#lib/react-router-aid/react-router-aid.js'
import { useRouteLoaderData } from '#lib/react-router-loader/react-router-loader.js'
import { useParams } from 'react-router'
import { MissingSchema } from '../components/MissingSchema.jsx'
import { NamedType } from '../components/NamedType.jsx'
import type { reference } from './reference.jsx'

const Component = () => {
  const params = useParams() as { type: string }

  const data = useRouteLoaderData<typeof reference.loader>(`/reference`)
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
