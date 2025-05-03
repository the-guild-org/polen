import type { Changelog } from './api/changelog/index.js'

export interface ProjectData {
  changelog: null | Changelog.Changelog
  siteNavigationItems: SiteNavigationItem[]
}

export interface SiteNavigationItem {
  title: string
  path: string
}
