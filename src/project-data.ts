import type { Config } from '#api/config/index.ts'
import type { FileRouter } from '#lib/file-router/index.ts'
import type { Schema } from './api/schema/index.ts'

export interface ProjectData {
  schema: null | Schema.Schema
  siteNavigationItems: SiteNavigationItem[]
  sidebarIndex: SidebarIndex
  faviconPath: string
  paths: Config.Config[`paths`][`project`]
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
  [pathExpression: string]: FileRouter.Sidebar.Sidebar
}
