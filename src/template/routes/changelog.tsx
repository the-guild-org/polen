import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
import PROJECT_SCHEMA from 'virtual:polen/project/schema.jsonsuper'
import { Changelog } from '../components/Changelog.js'
import { ChangelogLayout } from '../components/ChangelogLayout.js'

const loader = createLoader(() => {
  return {
    schema: PROJECT_SCHEMA,
  }
})

const Component = () => {
  const data = useLoaderData<typeof loader>()

  if (!data.schema) {
    return <div>No data to show. There is no schema is.</div>
  }

  return (
    <ChangelogLayout versions={data.schema.versions}>
      <Changelog schema={data.schema} />
    </ChangelogLayout>
  )
}

export const changelog = createRoute({
  path: `changelog`,
  loader,
  Component,
})
