export type { Config, ConfigInput, InputSourceName } from './config-schema.js'
export { InputSourceNameSchema } from './config-schema.js'

// Keep legacy exports for backward compatibility during migration
import type { InputSources } from './input-sources/$.js'

export type DataSourceTypeNew = typeof InputSources[keyof typeof InputSources]['loader']['name']
