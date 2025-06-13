import type { Config } from '#api/config/index'
import type { Schema } from './api/schema/index.ts'

export interface ProjectData {
  schema: null | Schema.Schema
  faviconPath: string
  basePath: string
  paths: Config.Config[`paths`][`project`]
  server: {
    static: {
      directory: string
      route: string
    }
  }
}
