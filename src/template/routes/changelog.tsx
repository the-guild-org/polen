import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Revision } from '#lib/revision/$'
import { ChangelogLoaderData } from '#template/route-schemas/route-schemas'
import { Effect, Match } from 'effect'
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

  // Return plain data without schema encoding
  // GraphQLSchema instances will be handled on client
  return catalog
}

const Component = () => {
  const catalog = useLoaderData(ChangelogLoaderData)

  if (!catalog) {
    return <div>No schema changes available for changelog.</div>
  }

  // Extract revisions based on catalog type
  const revisions = Match.value(catalog).pipe(
    Match.tag('CatalogUnversioned', (c) => c.schema.revisions),
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

export const changelog = route({
  schema: ChangelogLoaderData,
  path: `changelog`,
  loader: changelogLoader,
  Component,
})
