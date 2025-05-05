import type { Schema } from './api/schema/index.js'

export interface ProjectData {
  schema: null | Schema.Schema
  siteNavigationItems: SiteNavigationItem[]
}

export interface SiteNavigationItem {
  title: string
  path: string
}
