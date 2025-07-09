import type { Content } from '#api/content/$'
import { Grafaid } from '#lib/grafaid/index'
import { Arr } from '@wollybeard/kit'
import { Outlet } from 'react-router'
import projectPagesCatalog from 'virtual:polen/project/data/pages-catalog.jsonsuper'
import SCHEMA from 'virtual:polen/project/data/schema.jsonsuper'
import { getRequestContext } from '../contexts-async/request.js'
import { LayoutSidebarClient } from './layout.sidebar.client.js'

export async function Component() {
  const { request } = getRequestContext()
  const currentNavPathExp = getCurrentNavPathExp(new URL(request.url))

  const isReferencePage = currentNavPathExp === '/reference'

  const sidebar = (() => {
    if (isReferencePage && SCHEMA) {
      // Build reference sidebar from schema types
      const schema = SCHEMA.versions[0].after
      const kindMap = Grafaid.Schema.KindMap.getKindMap(schema)

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

      return { items: sidebarItems }
    } else {
      // Use regular page sidebar
      return currentNavPathExp ? projectPagesCatalog.sidebarIndex[currentNavPathExp] || null : null
    }
  })()

  const sidebarItems = sidebar?.items || []

  return (
    <LayoutSidebarClient sidebarItems={sidebarItems}>
      <Outlet />
    </LayoutSidebarClient>
  )
}

// Determine which sidebar to show based on current path
const getCurrentNavPathExp = (url: URL): string | null => {
  const segments = url.pathname.split('/').filter(Boolean)
  if (Arr.isntEmpty(segments)) {
    return `/${segments[0]}`
  }
  return null
}
