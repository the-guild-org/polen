import type { Config } from '#api/config/index'
import type { Schema } from './api/schema/index.js'

export interface ProjectData {
  schema: null | Schema.Schema
  basePath: string
  paths: Config.Config[`paths`][`project`]
  server: {
    static: {
      directory: string
      route: string
    }
  }
}
