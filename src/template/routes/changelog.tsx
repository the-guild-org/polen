import { Catalog } from '#lib/catalog/$'
import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Version } from '#lib/version/$'
import { Box, Button, Flex } from '@radix-ui/themes'
import { Effect } from 'effect'
import React from 'react'
import { useNavigate, useParams } from 'react-router'
import { catalogBridge } from '../catalog-bridge.js'
import {
  CatalogRailway,
  type RevisionClickEventHandler,
  type VersionClickEventHandler,
} from '../components/CatalogRailway/CatalogRailway.js'
import { type LayoutMode, RevisionAddress, VersionAddress } from '../components/CatalogRailway/helpers.js'
import { VersionColumns } from '../components/Changelog/VersionColumns.js'
import { ChangelogRailwayLayout } from '../layouts/ChangelogRailwayLayout.js'

const schema = Catalog.Catalog

const changelogLoader = async () => {
  const catalog = await Effect.runPromise(catalogBridge.view())
  return catalog!
}

const Component = () => {
  const catalog = useLoaderData(schema)
  const navigate = useNavigate()
  const params = useParams()

  // Layout mode state
  const [layoutMode, setLayoutMode] = React.useState<LayoutMode>('uniform')

  // Determine current address from URL params
  const currentAddress = React.useMemo(() => {
    const urlVersion = params['version']
    const urlRevision = params['revision']

    if (!urlVersion) return undefined

    if (Catalog.Unversioned.is(catalog)) return undefined

    // Find matching schema
    const schema = catalog.entries.find(entry => Version.toString(entry.version) === urlVersion)

    if (!schema) return undefined

    // If revision is provided, create a RevisionAddress
    if (urlRevision) {
      const revision = schema.revisions.find(rev => rev.date === urlRevision)
      return revision ? RevisionAddress.make(schema, revision) : undefined
    }

    // If only version is provided, create a VersionAddress
    return VersionAddress.make(schema)
  }, [catalog, params['version'], params['revision']])

  const handleRevisionClick: RevisionClickEventHandler = (event) => {
    const versionString = Version.toString(event.address.schema.version)
    const revisionDate = event.address.revision.date
    navigate(`/changelog/version/${versionString}/revision/${revisionDate}`)
  }

  const handleVersionClick: VersionClickEventHandler = (event) => {
    const versionString = Version.toString(event.schema.version)
    navigate(`/changelog/version/${versionString}`)
  }

  return (
    <ChangelogRailwayLayout
      railway={
        <CatalogRailway
          catalog={catalog}
          currentAddress={currentAddress}
          onRevisionClick={handleRevisionClick}
          onVersionClick={handleVersionClick}
          layoutMode={layoutMode}
        />
      }
    >
      <VersionColumns
        catalog={catalog}
        currentRevision={undefined}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
      />
    </ChangelogRailwayLayout>
  )
}

export const changelog = route({
  schema,
  path: `changelog`,
  loader: changelogLoader,
  Component,
  children: [
    // Support deep linking to specific version
    route({
      path: `version/:version`,
      loader: changelogLoader,
      Component,
    }),
    // Support deep linking to specific version/revision
    route({
      path: `version/:version/revision/:revision`,
      loader: changelogLoader,
      Component,
    }),
  ],
})
