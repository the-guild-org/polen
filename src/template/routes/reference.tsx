import type { Content } from '#api/content/$'
import { GrafaidOld } from '#lib/grafaid-old/index'
import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { createLoader, useLoaderData } from '#lib/react-router-loader/react-router-loader'
import { Box } from '@radix-ui/themes'
import { Outlet } from 'react-router'
import PROJECT_DATA from 'virtual:polen/project/data.jsonsuper'
import { SidebarLayout } from '../components/layouts/index.js'
import { MissingSchema } from '../components/MissingSchema.js'
import { reference$type } from './reference.$type.js'

const loader = createLoader(() => {
  const latestSchemaVersion = PROJECT_DATA.schema?.versions[0].after ?? null
  return {
    schema: latestSchemaVersion,
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

  for (const [title, types] of kindEntries) {
    sidebarItems.push({
      type: `ItemSection` as const,
      title,
      pathExp: `reference-${title.toLowerCase()}`,
      isLinkToo: false,
      links: types.map(type => ({
        type: `ItemLink` as const,
        title: type.name,
        pathExp: `reference/${type.name}`,
      })),
    })
  }

  return (
    <SidebarLayout sidebar={sidebarItems}>
      <Outlet />
    </SidebarLayout>
  )
}

export const reference = createRoute({
  path: `reference`,
  loader,
  Component,
  children: [reference$type],
})
