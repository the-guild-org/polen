import type { Content } from '#api/content/$'
import { Api } from '#api/iso'
import { Catalog } from '#lib/catalog/$'
import { GrafaidOld } from '#lib/grafaid-old'
import { S } from '#lib/kit-temp/effect'
import { Lifecycles } from '#lib/lifecycles/$'
import { route, useLoaderData } from '#lib/react-router-effect/react-router-effect'
import { Version } from '#lib/version/$'
import { catalog } from '#template/data/catalog'
import { neverCase } from '@wollybeard/kit/language'
import { Effect, Match } from 'effect'
import React from 'react'
import { useParams } from 'react-router'
import { catalogBridge, hasCatalog } from '../catalog-bridge.js'
import { Field } from '../components/Field.js'
import { MissingSchema } from '../components/MissingSchema.js'
import { NamedType } from '../components/NamedType.js'
import { VersionPicker } from '../components/VersionPicker.js'
import { GraphqlLifecycleProvider } from '../contexts/GraphqlLifecycleContext.js'
import { SidebarLayout } from '../layouts/index.js'

const routeSchema = S.Struct({
  catalog: Catalog.Catalog,
  requestedVersion: S.String,
})

const referenceLoader = async ({ params }: any) => {
  const catalog = await Effect.runPromise(catalogBridge.view())
  return {
    catalog: catalog!,
    requestedVersion: params.version ?? Api.Schema.VERSION_LATEST,
  }
}

// Single component that handles all reference route variations
const ReferenceView = () => {
  const params = useParams() as { version?: string; type?: string; field?: string }

  const loaderData = useLoaderData(routeSchema)

  const { catalog, requestedVersion } = loaderData

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
          const schema = c.entries[c.entries.length - 1]
          schemaObj = schema
        } else {
          const schema = c.entries.find(schema => Version.toString(schema.version) === requestedVersion)
          schemaObj = schema
        }
        return {
          schema: schemaObj?.definition,
          availableVersions: c.entries.map(schema => Version.toString(schema.version)),
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
  route({
    index: true,
    Component: ReferenceView,
    loader: referenceLoader,
    schema: routeSchema,
  }),
  route({
    path: `:type`,
    Component: ReferenceView,
    errorElement: <MissingSchema />,
    loader: referenceLoader,
    schema: routeSchema,
    children: [
      route({
        path: `:field`,
        Component: ReferenceView,
        errorElement: <MissingSchema />,
        loader: referenceLoader,
        schema: routeSchema,
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

export const reference = !hasCatalog()
  ? null
  : route({
    path: `reference`,
    children: [
      ...typeAndFieldRoutes,
      // Only add version routes if versioned
      ...(Catalog.Versioned.is(catalog)
        ? [route({
          path: `version/:version`,
          children: typeAndFieldRoutes,
        })]
        : []),
    ],
  })
