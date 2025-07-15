import type { Config } from '#api/config/index'
import type { NavbarItem } from '#api/content/navbar'

export interface ProjectData {
  basePath: string
  paths: Config.Config[`paths`][`project`]
  navbar: NavbarItem[]
  server: {
    port: number
    static: {
      directory: string
      route: string
    }
    routes: {
      assets: string
    }
  }
  warnings: Config.Config[`warnings`]
}
