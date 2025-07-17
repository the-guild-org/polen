import type { Content } from '#api/content/$'
import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { GrafaidOld } from '#lib/grafaid-old/index'
import { route, routeIndex } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { Box } from '@radix-ui/themes'
import { neverCase } from '@wollybeard/kit/language'
import { useParams } from 'react-router'
import { Field } from '../components/Field.js'
import { MissingSchema } from '../components/MissingSchema.js'
import { NamedType } from '../components/NamedType.js'
import { VersionPicker } from '../components/VersionPicker.js'
import { SidebarLayout } from '../layouts/index.js'
import { schemaSource } from '../sources/schema-source.js'

export const loader = createLoader(async ({ params }) => {
  // Handle both versioned and unversioned routes:
  // - Versioned: /reference/version/:version/:type → params.version exists
  // - Unversioned: /reference/:type → params.version is undefined, defaults to latest
  const currentVersion = params.version ?? Api.Schema.VERSION_LATEST

  const schema = await schemaSource.get(currentVersion)
  const availableVersions = schemaSource.versions

  return {
    schema,
    currentVersion,
    availableVersions,
  }
})

// Single component that handles all reference route variations
const ReferenceView = () => {
  const params = useParams() as { version?: string; type?: string; field?: string }
  const data = useLoaderData<typeof loader>()

  if (!data.schema) {
    return <MissingSchema />
  }

  // Build reference sidebar from schema types
  const kindMap = GrafaidOld.getKindMap(data.schema)

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
  const basePath = Api.Schema.Routing.createReferenceBasePath(data.currentVersion)

  // Determine view type and render appropriate content
  const viewType = Api.Schema.Routing.getReferenceViewType({
    schema: data.schema,
    type: params.type,
    field: params.field,
  })

  const content: React.ReactNode = (() => {
    if (viewType === 'index') {
      return <div>Select a type from the sidebar to view its documentation.</div>
    } else if (viewType === 'type-missing' || viewType === 'field-missing') {
      return <MissingSchema />
    } else if (viewType === 'type') {
      const type = data.schema.getType(params.type!)!
      return <NamedType data={type} />
    } else if (viewType === 'field') {
      const type = data.schema.getType(params.type!)!
      const fields = (type as any).getFields()
      const field = fields[params.field!]
      return <Field data={field} />
    } else {
      neverCase(viewType)
    }
  })()

  return (
    <SidebarLayout sidebar={sidebarItems} basePath={basePath}>
      <Box mb={`4`}>
        <VersionPicker
          all={[...data.availableVersions]} // Convert readonly to mutable
          current={data.currentVersion}
        />
      </Box>
      {content}
    </SidebarLayout>
  )
}

// Define routes that handle type and field params
const typeAndFieldRoutes = [
  routeIndex({
    Component: ReferenceView,
    loader,
  }),
  route({
    path: `:type`,
    Component: ReferenceView,
    errorElement: <MissingSchema />,
    loader,
    children: [
      route({
        path: `:field`,
        Component: ReferenceView,
        errorElement: <MissingSchema />,
        loader,
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
export const reference = route({
  path: `reference`,
  children: [
    ...typeAndFieldRoutes,
    route({
      path: `version/:version`,
      children: typeAndFieldRoutes,
    }),
  ],
})
