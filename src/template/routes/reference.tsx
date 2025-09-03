import type { Content } from '#api/content/$'
import { Api } from '#api/iso'
import { Catalog } from '#lib/catalog/$'
import { GrafaidOld } from '#lib/grafaid-old'
import { S } from '#lib/kit-temp/effect'
import { Lifecycles } from '#lib/lifecycles/$'
import { route, useLoaderData } from '#lib/react-router-effect/react-router-effect'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
import { schemaCatalog } from '#template/data/schema-catalog'
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
  schema: Schema.Schema,
})

const referenceLoader = ({ params }: any) =>
  catalogBridge.view().pipe(
    Effect.map(catalog => {
      // Resolve the actual schema based on catalog type and params
      const schema = Match.value(catalog).pipe(
        Match.tagsExhaustive({
          CatalogUnversioned: (c) => c.schema,
          CatalogVersioned: (c) => {
            // If version param provided, find that specific version
            if (params.version) {
              const requestedVersion = Version.decodeSync(params.version)
              const found = c.entries.find(s => Version.equivalence(requestedVersion, s.version))
              if (!found) {
                // TODO: Return 404 error
                throw new Error(`Version ${params.version} not found`)
              }
              return found
            }
            // No version param means "latest" - use the last entry
            const latest = c.entries[c.entries.length - 1]
            if (!latest) {
              throw new Error('No schemas available in versioned catalog')
            }
            return latest
          },
        }),
      )

      return {
        catalog,
        schema,
      }
    }),
  )

// Single component that handles all reference route variations
const ReferenceView = () => {
  const params = useParams() as { version?: string; type?: string; field?: string }
  const loaderData = useLoaderData(routeSchema)
  const { catalog, schema } = loaderData

  // Create lifecycles from schema
  const lifecycle = React.useMemo(() => Lifecycles.createFromSchema(schema), [schema])

  if (!schema) {
    // this would be some sort of internal error, make issue more clear.
    return <MissingSchema />
  }

  // Build reference sidebar from schema types
  const kindMap = GrafaidOld.getKindMap(schema.definition)

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

  // Calculate basePath based on schema version
  const basePath = Api.Schema.Routing.createReferenceBasePath(
    Schema.getVersion(schema),
  )

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
      const type = schema.definition.getType(params.type!)!
      return <NamedType data={type} />
    } else if (viewType === 'field') {
      const type = schema.definition.getType(params.type!)!
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
    <GraphqlLifecycleProvider lifecycle={lifecycle} schema={schema}>
      <SidebarLayout
        sidebar={sidebarItems}
        basePath={basePath}
        topContent={(() => {
          const version = Schema.getVersion(schema)
          return catalog._tag === 'CatalogVersioned' && version
            ? (
              <VersionPicker
                data={catalog.entries.map(entry => entry.version)}
                current={version}
              />
            )
            : null
        })()}
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
      ...(Catalog.Versioned.is(schemaCatalog)
        ? [route({
          path: `version/:version`,
          children: typeAndFieldRoutes,
        })]
        : []),
    ],
  })
