import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { Changelog } from '../components/Changelog.jsx'

const loader = createLoader(() => {
  return {
    schema: PROJECT_DATA.schema,
  }
})

const Component = () => {
  const data = useLoaderData<typeof loader>()

  if (!data.schema) {
    return <div>No data to show. There is no schema is.</div>
  }

  return <Changelog schema={data.schema} />
}

export const changelog = createRoute({
  path: `changelog`,
  loader,
  Component,
})
