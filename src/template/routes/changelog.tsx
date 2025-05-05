import { createRoute } from '#lib/react-router-helpers.js'
import { Changelog } from '../components/Changelog.jsx'
import { PROJECT_DATA } from 'virtual:polen/project/data'
import { useLoaderData } from 'react-router'
import { Superjson } from '#lib/superjson/index.js'

const loader = () => {
  const data = {
    schema: PROJECT_DATA.schema,
  }
  const superjson = {
    superjson: Superjson.stringify(data),
  }

  return { superjson }
}

const Component = () => {
  const data = useLoaderData<Pick<typeof PROJECT_DATA, `schema`>>()

  if (!data.schema) {
    return <div>No data to show. There is no schema is.</div>
  }

  return <Changelog schema={data.schema} />
}

export const changelog = createRoute({
  path: `/changelog`,
  loader,
  Component,
})
