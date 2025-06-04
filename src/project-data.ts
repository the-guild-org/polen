import type { FileRouter } from '#lib/file-router/index.js'
import type { Configurator } from './api/configurator/index.js'
import type { Schema } from './api/schema/index.js'

export interface ProjectData {
  schema: null | Schema.Schema
  siteNavigationItems: SiteNavigationItem[]
  sidebarIndex: SidebarIndex
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

export interface SidebarIndex {
  [pathExpression: string]: Sidebar
}

export interface Sidebar {
  items: SidebarItem[]
}

export type SidebarItem = SidebarNav | SidebarSection

export interface SidebarNav {
  type: `SidebarItem`
  title: string
  pathExp: string
}

export interface SidebarSection {
  type: `SidebarSection`
  title: string
  pathExp: string
  isNavToo: boolean
  navs: SidebarNav[]
}
