import { Api } from '#api/iso'
import { Ef, Op, S } from '#dep/effect'
import { route, useLoaderData } from '#lib/react-router-effect/react-router-effect'
import { Str } from '@wollybeard/kit'
import { HashMap, Match } from 'effect'
import { Catalog, Grafaid, GrafaidOld, Lifecycles, Schema, Version } from 'graphql-kit'
import React from 'react'
import { redirect, useParams } from 'react-router'
import { templateConfig } from 'virtual:polen/project/config'
import { IndexComponent } from 'virtual:polen/project/reference'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { TypeKindIcon } from '../components/graphql/graphql.js'
import { Field } from '../components/reference/Field.js'
import { NamedType } from '../components/reference/NamedType.js'
import { ReferenceVersionPicker } from '../components/reference/ReferenceVersionPicker.js'
import { ViewModeToggle } from '../components/reference/ViewModeToggle.js'
import { Flex, Text } from '../components/ui/index.js'
import { GraphqlLifecycleProvider } from '../contexts/GraphqlLifecycleContext.js'
import { ReferenceConfigProvider } from '../contexts/ReferenceConfigContext.js'
import { ViewModeProvider } from '../contexts/ViewModeContext.js'
import { SidebarLayout } from '../layouts/index.js'
import { MdxProvider } from '../providers/mdx.js'

const MissingSchema: React.FC = () => {
  return <div>No content to show. There is no schema to work with.</div>
}

const routeSchema = S.Struct({
  catalog: Catalog.Catalog,
  schema: Schema.Schema,
})

const referenceLoader = ({ params }: any) => {
  // Check if reference is enabled
  if (!templateConfig.reference.enabled) {
    throw new Response('Reference documentation is disabled', { status: 404 })
  }

  // Check if no type is selected (index route) and no custom index exists
  if (!params.type && !params.version && !IndexComponent) {
    // Redirect to Query type which is guaranteed to exist
    throw redirect('/reference/Query')
  }

  // This should never be called when schemasCatalog is null
  // because the route won't be added to the router
  // But we return an Ef.fail for safety
  if (!schemasCatalog) {
    return Ef.fail(
      new Error(
        'No schema catalog available. This page requires a GraphQL schema to be configured. '
          + 'Please ensure your Polen configuration includes a valid schema source.',
      ),
    )
  }
  return Ef.succeed(schemasCatalog).pipe(
    Ef.map(catalog => {
      // Resolve the actual schema based on catalog type and params
      const schema = Match.value(catalog).pipe(
        Match.tagsExhaustive({
          CatalogUnversioned: (c: any) => c.schema,
          CatalogVersioned: (c: any) => {
            // If version param provided, find that specific version
            if (params.version) {
              const requestedVersion = Version.decodeSync(params.version)
              const foundOption = HashMap.get(c.entries, requestedVersion)
              if (Op.isNone(foundOption)) {
                // TODO: Return 404 error
                throw new Error(`Version ${params.version} not found`)
              }
              return Op.getOrThrow(foundOption)
            }
            // No version param means "latest" - use the last entry
            const latest = Catalog.Versioned.getLatestOrThrow(c)
            if (!latest) {
              throw new Error('No schemas available in versioned catalog')
            }
            return latest
          },
        } as any),
      ) as Schema.Schema

      return {
        catalog,
        schema,
      }
    }),
  )
}

// Single component that handles all reference route variations
const ReferenceView = () => {
  const params = useParams() as { version?: string; type?: string; field?: string }
  const loaderData = useLoaderData(routeSchema)
  const { catalog, schema } = loaderData

  // Create lifecycles from schema
  const lifecycle = Lifecycles.createFromSchema(schema)

  if (!schema) {
    // this would be some sort of internal error, make issue more clear.
    return <MissingSchema />
  }

  // Build reference sidebar from schema types
  const kindMap = GrafaidOld.getKindMap(schema.definition)

  const sidebarItems: any[] = [] // Will be cast to template types in SidebarLayout

  // Track types that will be in categories
  let typesInCategories = new Set<string>()
  if (schema.categories && schema.categories.length > 0) {
    for (const category of schema.categories) {
      if (category.types.length > 0) {
        // Add all type names from this category to the tracking set
        category.types.forEach((typeName: string) => typesInCategories.add(typeName))
      }
    }
  }

  // Process all type sections, filtering out types that are in categories
  const kindEntries = Object.entries(kindMap.list)
    .map(([title, types]) => [
      title,
      (types as any[]).filter((type: any) => !typesInCategories.has(type.name)),
    ])
    .filter(([_, types]) => (types as any[]).length > 0)

  // Helper function to create sidebar sections
  const createSidebarSection = (title: string, types: any[]) => ({
    type: `ItemSection` as const,
    title: Str.Case.title(Str.Case.snake(title)),
    pathExp: `reference-${title.toLowerCase()}`,
    isLinkToo: false,
    links: types.map((type: any) => {
      const kind = Grafaid.Schema.typeKindFromClass(type)
      return {
        type: `ItemLink` as const,
        title: (
          <Flex align='center' gap='1' display='inline-flex'>
            <TypeKindIcon kind={kind} />
            {type.name}
          </Flex>
        ),
        pathExp: type.name, // Just the type name, basePath will be prepended
      }
    }),
  })

  // 1. Add root types
  const rootEntries = kindEntries.filter(([title]) => title === 'Root')
  for (const [title, types] of rootEntries) {
    sidebarItems.push(createSidebarSection(title as string, types as any[]))
  }

  // 2. Add custom categories
  if (schema.categories && schema.categories.length > 0) {
    for (const category of schema.categories) {
      if (category.types.length > 0) {
        sidebarItems.push({
          type: `ItemSection` as const,
          title: category.name,
          pathExp: `reference-category-${category.name.toLowerCase().split(' ').join('-')}`,
          isLinkToo: false,
          links: category.types.map((typeName: string) => {
            const type = schema.definition.getType(typeName)
            if (!type) return null
            const kind = Grafaid.Schema.typeKindFromClass(type)
            return {
              type: `ItemLink` as const,
              title: (
                <Flex align='center' gap='1' display='inline-flex'>
                  <TypeKindIcon kind={kind} />
                  {typeName}
                </Flex>
              ),
              pathExp: typeName, // Just the type name, basePath will be prepended
            }
          }).filter(Boolean),
        })
      }
    }
  }

  // 3. Add remaining types
  const otherEntries = kindEntries.filter(([title]) => title !== 'Root')
  for (const [title, types] of otherEntries) {
    sidebarItems.push(createSidebarSection(title as string, types as any[]))
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
      // Render custom index component if available
      if (IndexComponent) {
        return (
          <MdxProvider schema={schema.definition}>
            <IndexComponent />
          </MdxProvider>
        )
      }
      // Fallback message (shouldn't reach here due to redirect)
      return <Text>Select a type from the sidebar to view its documentation.</Text>
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
      return Match.value(viewType).pipe(Match.exhaustive) as never
    }
  })()

  const referenceConfig = {
    descriptionsView: templateConfig.reference.descriptionsView,
    nullabilityRendering: templateConfig.reference.nullabilityRendering,
  }

  return (
    <ReferenceConfigProvider config={referenceConfig}>
      <ViewModeProvider defaultMode={referenceConfig.descriptionsView.defaultMode}>
        <GraphqlLifecycleProvider lifecycle={lifecycle} schema={schema}>
          <SidebarLayout
            sidebar={sidebarItems}
            basePath={basePath}
            topContent={(() => {
              const version = Schema.getVersion(schema)
              const versionPicker = catalog._tag === 'CatalogVersioned' && version
                ? (
                  <ReferenceVersionPicker
                    data={Catalog.Versioned.getVersions(catalog)}
                    current={version}
                  />
                )
                : null

              return (
                <Flex gap='3' align='center'>
                  {versionPicker}
                  {referenceConfig.descriptionsView.showControl && <ViewModeToggle />}
                </Flex>
              )
            })()}
          >
            {content}
          </SidebarLayout>
        </GraphqlLifecycleProvider>
      </ViewModeProvider>
    </ReferenceConfigProvider>
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

export const reference = !schemasCatalog || !templateConfig.reference.enabled
  ? null
  : route({
    path: `reference`,
    children: [
      ...typeAndFieldRoutes,
      // Only add version routes if versioned
      ...(Catalog.Versioned.is(schemasCatalog)
        ? [route({
          path: `version/:version`,
          children: typeAndFieldRoutes,
        })]
        : []),
    ],
  })
