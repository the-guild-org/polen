import type { Content } from '#api/content/$'
import { GrafaidOld } from '#lib/grafaid-old/index'
import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { Box } from '@radix-ui/themes'
import { Outlet } from 'react-router'
import { MissingSchema } from '../components/MissingSchema.js'
import { VersionSelector } from '../components/VersionSelector.js'
import { useVersionPath } from '../hooks/useVersionPath.js'
import { SidebarLayout } from '../layouts/index.js'
import { VERSION_LATEST } from '../lib/schema-utils/constants.js'
import * as SchemaSource from '../sources/schema-source.js'
import { reference$type } from './reference.$type.js'
import { referenceVersion$version$type } from './reference.version.$version.$type.js'

const loader = createLoader(async ({ params }) => {
  // Handle both versioned and unversioned routes:
  // - Versioned: /reference/version/:version/:type → params.version exists
  // - Unversioned: /reference/:type → params.version is undefined, defaults to latest
  const currentVersion = params.version ?? VERSION_LATEST

  const schema = await SchemaSource.get(currentVersion)
  const availableVersions = SchemaSource.getAvailableVersions()

  return {
    schema,
    currentVersion,
    availableVersions,
  }
})

const Component = () => {
  const data = useLoaderData<typeof loader>()

  if (!data.schema) {
    return <MissingSchema />
  }

  // Build reference sidebar from schema types
  const kindMap = GrafaidOld.getKindMap(data.schema)

  const sidebarItems: Content.Item[] = []
  const kindEntries = Object.entries(kindMap.list).filter(([_, types]) => types.length > 0)

  // Build path prefix based on current version using new route structure
  const versionPath = useVersionPath()

  for (const [title, types] of kindEntries) {
    sidebarItems.push({
      type: `ItemSection` as const,
      title,
      pathExp: `reference-${title.toLowerCase()}`,
      isLinkToo: false,
      links: types.map(type => ({
        type: `ItemLink` as const,
        title: type.name,
        pathExp: `reference/${versionPath}${type.name}`,
      })),
    })
  }

  return (
    <SidebarLayout sidebar={sidebarItems}>
      <Box mb={`4`}>
        <VersionSelector
          availableVersions={data.availableVersions}
          currentVersion={data.currentVersion}
        />
      </Box>
      <Outlet />
    </SidebarLayout>
  )
}

// Create the versioned reference route with explicit version prefix
const referenceVersioned = createRoute({
  path: `version/:version`,
  loader,
  Component,
  children: [referenceVersion$version$type],
})

// Create the main reference route with explicit version path and fallback type path
export const reference = createRoute({
  path: `reference`,
  loader,
  Component,
  children: [referenceVersioned, reference$type],
})
