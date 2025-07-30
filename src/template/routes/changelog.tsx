import { Catalog } from '#lib/catalog/$'
import { schemaRoute, useLoaderData } from '#lib/react-router-effect/react-router-effect'
import { Revision } from '#lib/revision/$'
import { ChangelogLoaderData } from '#lib/route-schemas/route-schemas'
import { Effect, Match } from 'effect'
import React from 'react'
import { catalogBridge, hasCatalog } from '../catalog-bridge.js'
import { Changelog } from '../components/Changelog.js'
import { ChangelogLayout } from '../layouts/index.js'

const changelogLoader = async () => {
  // Check if catalog exists first
  if (!hasCatalog()) {
    return null
  }

  // For now, we need to get the full catalog using view() until peek selections are implemented
  // view() returns the fully hydrated catalog
  const catalog = await Effect.runPromise(catalogBridge.view())

  // Return decoded data - encoding is handled automatically by schemaRoute
  return catalog
}

const Component = () => {
  // Data is automatically decoded using the schema
  const catalog = useLoaderData(ChangelogLoaderData)

  if (!catalog) {
    return <div>No schema changes available for changelog.</div>
  }

  // Extract revisions based on catalog type
  const revisions = Match.value(catalog).pipe(
    Match.tag('CatalogUnversioned', (c) => c.revisions),
    Match.tag('CatalogVersioned', (c) => c.entries.flatMap(e => e.revisions)),
    Match.exhaustive,
  )

  if (revisions.length === 0) {
    return <div>No schema changes available for changelog.</div>
  }

  // For now, always show revisions in a flat list
  // TODO: In the future, enhance to show grouped by version for versioned schemas
  return (
    <ChangelogLayout revisions={revisions as Revision.Revision[]}>
      <Changelog
        revisions={revisions as [Revision.Revision, ...Revision.Revision[]]}
      />
    </ChangelogLayout>
  )
}

export const changelog = schemaRoute({
  path: `changelog`,
  schema: ChangelogLoaderData,
  loader: changelogLoader,
  Component,
})
