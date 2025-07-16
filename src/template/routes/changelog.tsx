import type { GraphqlChangeset } from '#lib/graphql-changeset/index'
import { route } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { Changelog } from '../components/Changelog.js'
import { ChangelogLayout } from '../layouts/index.js'
import { schemaSource } from '../sources/schema-source.js'

const loader = createLoader(async () => {
  // Check if schema exists first
  if (schemaSource.isEmpty) {
    return { changesets: [] }
  }

  // Fetch all changesets with before/after/changes data
  const changesets = await schemaSource.getAllChangesets()

  return {
    changesets,
  }
})

const Component = () => {
  const data = useLoaderData<typeof loader>()

  if (data.changesets.length === 0) {
    return <div>No schema versions available for changelog.</div>
  }

  return (
    <ChangelogLayout versions={data.changesets}>
      <Changelog changesets={data.changesets as [GraphqlChangeset.ChangeSet, ...GraphqlChangeset.ChangeSet[]]} />
    </ChangelogLayout>
  )
}

export const changelog = route({
  path: `changelog`,
  loader,
  Component,
})
