import type { Config } from '#api/config/$'
import type { NavbarItem } from '#api/content/navbar'

export interface ProjectData {
  basePath: string
  paths: Config.Config['paths']
  navbar: NavbarItem[]
  server: Config.Config['server']
  warnings: Config.Config['warnings']
}
