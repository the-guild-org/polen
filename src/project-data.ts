import type { Configurator } from './api/configurator/index.js'
import type { Schema } from './api/schema/index.js'

export interface ProjectData {
  schema: null | Schema.Schema
  siteNavigationItems: SiteNavigationItem[]
  faviconPath: string
  paths: Configurator.Config[`paths`][`project`]
  server: {
    static: {
      directory: string
      route: string
    }
  }
}

export interface SiteNavigationItem {
  title: string
  path: string
}
