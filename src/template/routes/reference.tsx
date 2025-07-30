import type { Content } from '#api/content/$'
import { Api } from '#api/iso'
import { Catalog } from '#lib/catalog/$'
import { GrafaidOld } from '#lib/grafaid-old'
import { Lifecycles } from '#lib/lifecycles/$'
import { route } from '#lib/react-router-aid/react-router-aid'
import { schemaRoute, useLoaderData } from '#lib/react-router-effect/react-router-effect'
import { ReferenceLoaderData } from '#lib/route-schemas/route-schemas'
import { Version } from '#lib/version/$'
import { neverCase } from '@wollybeard/kit/language'
import { Effect, Match } from 'effect'
import React from 'react'
import { useParams } from 'react-router'
import PROJECT_SCHEMA from 'virtual:polen/project/schema.json'
import { catalogBridge, hasCatalog } from '../catalog-bridge.js'
import { Field } from '../components/Field.js'
import { MissingSchema } from '../components/MissingSchema.js'
import { NamedType } from '../components/NamedType.js'
import { VersionPicker } from '../components/VersionPicker.js'
import { GraphqlLifecycleProvider } from '../contexts/GraphqlLifecycleContext.js'
import { SidebarLayout } from '../layouts/index.js'

const referenceLoader = async ({ params }: any) => {
  if (!hasCatalog()) {
    throw new Error('No schema available')
  }

  // For now, we need to get the full catalog using view() until peek selections are implemented
  // view() returns the fully hydrated catalog
  const catalog = await Effect.runPromise(catalogBridge.view())

  console.log('Catalog from bridge:', catalog)
  console.log('Catalog type:', typeof catalog)
  console.log('Catalog _tag:', catalog?._tag)

  // Return decoded data - encoding is handled automatically by schemaRoute
  return {
    catalog,
    requestedVersion: params.version ?? Api.Schema.VERSION_LATEST,
  }
}

// Single component that handles all reference route variations
const ReferenceView = () => {
  const params = useParams() as { version?: string; type?: string; field?: string }
  // Data is automatically decoded using the schema
  const loaderData = useLoaderData(ReferenceLoaderData)
  console.log('Loader data:', loaderData)
  const { catalog, requestedVersion } = loaderData

  console.log('Catalog in component:', catalog)
  console.log('Catalog type:', typeof catalog)
  console.log('Catalog _tag:', catalog._tag)

  // Create lifecycles from catalog
  const lifecycle = React.useMemo(() => Lifecycles.create(catalog), [catalog])

  // Extract schema and version info based on catalog type
  const { schema, availableVersions, currentVersion } = React.useMemo(() => {
    return Match.value(catalog).pipe(
      Match.tag('CatalogUnversioned', (c) => ({
        schema: c.schema.definition,
        availableVersions: [],
        currentVersion: '',
      })),
      Match.tag('CatalogVersioned', (c) => {
        // Find the matching version
        let schemaObj
        if (requestedVersion === Api.Schema.VERSION_LATEST) {
          const latestEntry = c.entries[c.entries.length - 1]
          schemaObj = latestEntry?.schema
        } else {
          const entry = c.entries.find(e => Version.toString(e.schema.version) === requestedVersion)
          schemaObj = entry?.schema
        }
        return {
          schema: schemaObj?.definition,
          availableVersions: c.entries.map(e => Version.toString(e.schema.version)),
          currentVersion: requestedVersion,
        }
      }),
      Match.exhaustive,
    )
  }, [catalog, requestedVersion])

  if (!schema) {
    return <MissingSchema />
  }

  // Build reference sidebar from schema types
  const kindMap = GrafaidOld.getKindMap(schema)

  const sidebarItems: Content.Item[] = []
  const kindEntries = Object.entries(kindMap.list).filter(([_, types]) => types.length > 0)

  for (const [title, types] of kindEntries) {
    sidebarItems.push({
      type: `ItemSection` as const,
      title,
      pathExp: `reference-${title.toLowerCase()}`,
      isLinkToo: false,
      links: types.map(type => ({
        type: `ItemLink` as const,
        title: type.name,
        pathExp: type.name, // Just the type name, basePath will be prepended
      })),
    })
  }

  // Calculate basePath based on current version
  const basePath = Api.Schema.Routing.createReferenceBasePath(currentVersion)

  // Determine view type and render appropriate content
  const viewType = Api.Schema.Routing.getReferenceViewType({
    schema: schema,
    type: params.type || '',
    field: params.field || '',
  })

  const content: React.ReactNode = (() => {
    if (viewType === 'index') {
      return <div>Select a type from the sidebar to view its documentation.</div>
    } else if (viewType === 'type-missing' || viewType === 'field-missing') {
      return <MissingSchema />
    } else if (viewType === 'type') {
      const type = schema.getType(params.type!)!
      return <NamedType data={type} />
    } else if (viewType === 'field') {
      const type = schema.getType(params.type!)!
      const fields = (type as any).getFields()
      const field = fields[params.field!]
      return (
        <Field
          data={field}
          parentTypeName={params.type!}
        />
      )
    } else {
      neverCase(viewType)
    }
  })()

  return (
    <GraphqlLifecycleProvider lifecycle={lifecycle} currentVersion={currentVersion}>
      <SidebarLayout
        sidebar={sidebarItems}
        basePath={basePath}
        topContent={availableVersions.length > 0
          ? (
            <VersionPicker
              all={[...availableVersions]} // Convert readonly to mutable
              current={currentVersion}
            />
          )
          : null}
      >
        {content}
      </SidebarLayout>
    </GraphqlLifecycleProvider>
  )
}

// Define routes that handle type and field params
const typeAndFieldRoutes = [
  schemaRoute({
    index: true,
    Component: ReferenceView,
    schema: ReferenceLoaderData,
    loader: referenceLoader,
  } as any),
  schemaRoute({
    path: `:type`,
    Component: ReferenceView,
    errorElement: <MissingSchema />,
    schema: ReferenceLoaderData,
    loader: referenceLoader,
    children: [
      schemaRoute({
        path: `:field`,
        Component: ReferenceView,
        errorElement: <MissingSchema />,
        schema: ReferenceLoaderData,
        loader: referenceLoader,
      }),
    ],
  }),
]

/**
 * Reference documentation routes using proper React Router patterns
 * - Parent routes have no components (automatically render Outlet)
 * - Leaf routes have components and loaders that always run fresh
 * - Single ReferenceView component handles all variations
 */
// We need to determine if we have versioned catalog statically
// This is okay because PROJECT_SCHEMA is available at build time
const hasVersionedCatalog = PROJECT_SCHEMA && PROJECT_SCHEMA._tag === 'CatalogVersioned'

export const reference = !hasCatalog()
  ? null
  : route({
    path: `reference`,
    children: [
      ...typeAndFieldRoutes,
      // Only add version routes if versioned
      ...(hasVersionedCatalog
        ? [route({
          path: `version/:version`,
          children: typeAndFieldRoutes,
        })]
        : []),
    ],
  })
