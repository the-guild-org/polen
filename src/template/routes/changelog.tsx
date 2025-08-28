import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Revision } from '#lib/revision/$'
import { ChangelogLoaderData } from '#template/route-schemas/route-schemas'
import { Effect, Match } from 'effect'
import { catalogBridge, hasCatalog } from '../catalog-bridge.js'
import { Changelog } from '../components/Changelog.js'
import { Railway } from '../components/Changelog/Railway.js'
import { VersionColumns } from '../components/Changelog/VersionColumns.js'
import { useChangelogScroll } from '../hooks/useChangelogScroll.js'
import { ChangelogRailwayLayout } from '../layouts/ChangelogRailwayLayout.js'
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

  // Use entries directly for versioned, wrap unversioned in single entry
  const entries = Match.value(catalog).pipe(
    Match.tag('CatalogVersioned', (c) => {
      // Entries already have the correct structure: { schema, parent, revisions }
      return c.entries
    }),
    Match.tag('CatalogUnversioned', (c) => [{
      schema: c.schema,
      parent: null,
      revisions: c.schema.revisions,
    }]),
    Match.exhaustive,
  )

  if (entries.length === 0 || entries.every(e => e.revisions.length === 0)) {
    return <div>No schema changes available for changelog.</div>
  }

  // Use the new railway UI
  const {
    scrollContainerRef,
    currentPosition,
    handleNodeClick,
    handleScroll,
  } = useChangelogScroll(entries as any)

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{ height: '100vh', overflow: 'auto' }}
    >
      <ChangelogRailwayLayout
        railway={
          <Railway
            entries={entries as any}
            currentPosition={currentPosition}
            onNodeClick={handleNodeClick}
          />
        }
      >
        <VersionColumns
          entries={entries as any}
          currentRevision={currentPosition ? `${currentPosition.version}-${currentPosition.revision}` : undefined}
        />
      </ChangelogRailwayLayout>
    </div>
  )
}

export const changelog = route({
  schema: ChangelogLoaderData,
  path: `changelog`,
  loader: changelogLoader,
  Component,
  children: [
    // Support deep linking to specific version/revision
    route({
      path: `version/:version/revision/:revision`,
      loader: changelogLoader,
      Component,
    }),
  ],
})
