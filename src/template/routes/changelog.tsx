import { route } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { Revision } from '#lib/revision/$'
import { Changelog } from '../components/Changelog.js'
import { ChangelogLayout } from '../layouts/index.js'
import { schemaSource, type VersionedSchemaSource } from '../sources/schema-source.js'

const loader = createLoader(async () => {
  // Check if schema exists first
  if (schemaSource.type === 'none') {
    return {
      type: 'none' as const,
      revisions: [],
    }
  }

  if (schemaSource.type === 'unversioned') {
    // For unversioned schemas, show revisions directly
    const revisions = schemaSource.getRevisions()
    return {
      type: 'unversioned' as const,
      revisions,
    }
  } else {
    // For versioned schemas, group revisions by version
    const versionedSource = schemaSource as VersionedSchemaSource
    const versions = versionedSource.getVersions()
    const versionedRevisions = versions.map(version => ({
      version,
      revisions: versionedSource.getVersionRevisions(version),
    }))

    return {
      type: 'versioned' as const,
      versionedRevisions,
      // Also provide flat list for compatibility
      revisions: schemaSource.getRevisions(),
    }
  }
})

const Component = () => {
  const data = useLoaderData<typeof loader>()

  if (data.revisions.length === 0) {
    return <div>No schema changes available for changelog.</div>
  }

  // For now, always show revisions in a flat list
  // TODO: In the future, enhance to show grouped by version for versioned schemas
  return (
    <ChangelogLayout revisions={data.revisions}>
      <Changelog
        revisions={data.revisions as [Revision.Revision, ...Revision.Revision[]]}
      />
    </ChangelogLayout>
  )
}

export const changelog = route({
  path: `changelog`,
  loader,
  Component,
})
