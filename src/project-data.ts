import type { FileRouter } from '#lib/file-router/index.js'
import type { Configurator } from './api/configurator/index.js'
import type { Schema } from './api/schema/index.js'

export interface ProjectData {
  schema: null | Schema.Schema
  siteNavigationItems: SiteNavigationItem[]
  sidebar: Sidebar
  faviconPath: string
  paths: Configurator.Config[`paths`][`project`]
  pagesScanResult: FileRouter.ScanResult
  server: {
    static: {
      directory: string
      route: string
    }
  }
}

export interface SiteNavigationItem {
  title: string
  pathExp: string
}

export interface Sidebar {
  [navPath: string]: SidebarItem[]
}

export interface SidebarItem {
  title: string
  pathExp: string
  children?: SidebarItem[]
}
