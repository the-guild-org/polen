import type { Content } from '#api/content/$'
import { GrafaidOld } from '#lib/grafaid-old/index'
import { Grafaid } from '#lib/grafaid/index'
import { route, routeIndex } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { Box } from '@radix-ui/themes'
import { Outlet, useParams } from 'react-router'
import { Field } from '../components/Field.js'
import { MissingSchema } from '../components/MissingSchema.js'
import { NamedType } from '../components/NamedType.js'
import { VersionSelector } from '../components/VersionSelector.js'
import { SidebarLayout } from '../layouts/index.js'
import { VERSION_LATEST } from '../lib/schema-utils/constants.js'
import { schemaSource } from '../sources/schema-source.js'

export const loader = createLoader(async ({ params }) => {
  // Handle both versioned and unversioned routes:
  // - Versioned: /reference/version/:version/:type → params.version exists
  // - Unversioned: /reference/:type → params.version is undefined, defaults to latest
  const currentVersion = params.version ?? VERSION_LATEST

  const schema = await schemaSource.get(currentVersion)
  const availableVersions = schemaSource.versions

  return {
    schema,
    currentVersion,
    availableVersions,
  }
})

const RouteReferenceComponent = () => {
  const data = useLoaderData<typeof loader>()

  if (!data.schema) {
    return <MissingSchema />
  }

  // Build reference sidebar from schema types
  const kindMap = GrafaidOld.getKindMap(data.schema)

  const sidebarItems: Content.Item[] = []
  const kindEntries = Object.entries(kindMap.list).filter(([_, types]) => types.length > 0)

  // Build path prefix based on current version from loader data
  // This ensures sidebar links always match the current version being viewed
  const versionPath = data.currentVersion === VERSION_LATEST
    ? ``
    : `version/${data.currentVersion}/`

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

// Shared hooks for schema data validation and retrieval
const useReferenceSchema = () => {
  const data = useLoaderData<typeof loader>()
  if (!data.schema) {
    throw new Error('Schema not found')
  }
  return data
}

const useSchemaType = (typeName: string) => {
  const { schema } = useReferenceSchema()
  const type = schema.getType(typeName)
  if (!type) {
    throw new Error(`Could not find type ${typeName}`)
  }
  return type
}

const useSchemaField = (typeName: string, fieldName: string) => {
  const type = useSchemaType(typeName)
  if (!Grafaid.Schema.TypesLike.isFielded(type)) {
    throw new Error(`Type ${typeName} does not have fields`)
  }

  const fields = type.getFields()
  const field = fields[fieldName]
  if (!field) {
    throw new Error(`Could not find field ${fieldName} on type ${typeName}`)
  }
  return field
}

const RouteComponentIndex = () => {
  return <div>Select a type from the sidebar to view its documentation.</div>
}

const RouteComponentType = () => {
  const params = useParams() as { type: string }
  const type = useSchemaType(params.type)
  return <NamedType data={type} />
}

const RouteComponentTypeField = () => {
  const params = useParams() as { type: string; field: string }
  const field = useSchemaField(params.type, params.field)
  return <Field data={field} />
}

const typeAndFieldRoutes = [
  routeIndex(RouteComponentIndex),
  route({
    path: `:type`,
    Component: RouteComponentType,
    errorElement: <MissingSchema />,
    children: [
      route({
        path: `:field`,
        Component: RouteComponentTypeField,
        errorElement: <MissingSchema />,
      }),
    ],
  }),
]

/**
 * Reference documentation with proper nested structure - all routes in one file
 */
export const reference = route({
  path: `reference`,
  loader,
  Component: RouteReferenceComponent,
  children: [
    ...typeAndFieldRoutes,
    route({
      path: `version/:version`,
      children: typeAndFieldRoutes,
    }),
  ],
})
