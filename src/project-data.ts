import type { Config } from '#api/config/index'
import type { NavbarItem } from '#api/content/navbar'
import type { Schema } from './api/schema/index.js'

export interface ProjectData {
  schema: null | Schema.Schema
  basePath: string
  paths: Config.Config[`paths`][`project`]
  navbar: NavbarItem[]
  server: {
    port: number
    static: {
      directory: string
      route: string
    }
  }
}
