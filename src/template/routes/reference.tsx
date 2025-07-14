import type { Content } from '#api/content/$'
import { GrafaidOld } from '#lib/grafaid-old/index'
import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { Box } from '@radix-ui/themes'
import { Outlet, useParams } from 'react-router'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import PROJECT_SCHEMA_METADATA from 'virtual:polen/project/schema-metadata'
import { MissingSchema } from '../components/MissingSchema.js'
import { VersionSelector } from '../components/VersionSelector.js'
import { useVersionPath } from '../hooks/useVersionPath.js'
import { SidebarLayout } from '../layouts/index.js'
import { dateToVersionString, VERSION_LATEST } from '../lib/schema-utils/constants.js'
import { astToSchema, createSchemaCache } from '../lib/schema-utils/schema-utils.js'
import { reference$type } from './reference.$type.js'

// Cache for loaded schemas
const schemaCache = createSchemaCache()

const loader = createLoader(async ({ params }) => {
  // Get version from URL params
  const version = params.version || VERSION_LATEST

  // During SSR/dev, use the virtual module data
  if (typeof window === `undefined` && PROJECT_DATA.schema) {
    const schemaVersion = version === VERSION_LATEST
      ? PROJECT_DATA.schema.versions[0]
      : PROJECT_DATA.schema.versions.find(v => dateToVersionString(v.date) === version)

    if (schemaVersion) {
      return {
        schema: schemaVersion.after,
        version,
        availableVersions: PROJECT_SCHEMA_METADATA.versions,
      }
    }
  }

  // Check if we have schema metadata
  if (!PROJECT_SCHEMA_METADATA.hasSchema) {
    return { schema: null, version: null, availableVersions: [] }
  }

  // Check cache first
  if (schemaCache.has(version)) {
    return {
      schema: schemaCache.get(version),
      version,
      availableVersions: PROJECT_SCHEMA_METADATA.versions,
    }
  }

  // Fetch schema from assets (client-side navigation)
  try {
    const assetPath = `${PROJECT_DATA.basePath}${PROJECT_DATA.paths.relative.build.relative.assets}`
    const response = await fetch(`${assetPath}/schemas/${version}.json`)
    if (!response.ok) {
      throw new Error(`Failed to fetch schema for version ${version}`)
    }

    const schemaAst = await response.json()
    const schema = astToSchema(schemaAst)

    // Cache the converted schema
    schemaCache.set(version, schema)

    return {
      schema,
      version,
      availableVersions: PROJECT_SCHEMA_METADATA.versions,
    }
  } catch (error) {
    console.error(`Failed to load schema:`, error)
    // Fallback to virtual module data if available
    if (PROJECT_DATA.schema) {
      return {
        schema: PROJECT_DATA.schema.versions[0].after,
        version: VERSION_LATEST,
        availableVersions: PROJECT_SCHEMA_METADATA.versions,
      }
    }
    return { schema: null, version: null, availableVersions: [] }
  }
})

const Component = () => {
  const data = useLoaderData<typeof loader>()
  const params = useParams()

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
          currentVersion={data.version}
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
  children: [reference$type],
})

// Create the main reference route with explicit version path and fallback type path
export const reference = createRoute({
  path: `reference`,
  loader,
  Component,
  children: [referenceVersioned, reference$type],
})
