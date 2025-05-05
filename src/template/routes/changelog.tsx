import { createRoute } from '#lib/react-router-helpers.js'
import { Changelog } from '../components/Changelog.jsx'
import { PROJECT_DATA } from 'virtual:polen/project/data'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader.js'

const loader = createLoader(() => {
  return {
    schema: PROJECT_DATA.schema,
  }
})

const Component = () => {
  const data = useLoaderData<typeof loader>()
  console.log(data)

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
