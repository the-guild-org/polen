/**
 * Polen Configuration Schema using Effect
 *
 * This schema definition provides:
 * - Type-safe validation of config files
 * - Automatic TypeScript type generation
 * - Built-in validation with custom error messages
 * - Default values handling
 *
 * Usage example:
 * ```typescript
 * import { Schema } from 'effect'
 * import { ConfigInputSchema } from './schema.js'
 *
 * // Decode and validate config
 * const result = Schema.decodeUnknownEither(ConfigInputSchema)(rawConfig)
 *
 * if (Either.isLeft(result)) {
 *   // Handle validation errors with detailed messages
 *   console.error(TreeFormatter.formatError(result.left))
 * } else {
 *   // Use validated config
 *   const config = result.right
 * }
 * ```
 */
import { Schema } from 'effect'

// BuildArchitecture enum using Schema
const BuildArchitecture = Schema.Literal(`ssg`, `spa`, `ssr`)

// Base path schema with validation
const BasePath = Schema.String.pipe(
  Schema.filter((s) => s.startsWith(`/`) && s.endsWith(`/`), {
    message: () => `Base path must start and end with "/"`,
  }),
)

// Template variables schema
const TemplateVariables = Schema.Struct({
  title: Schema.optional(Schema.String),
})

// Build configuration schema
const BuildConfig = Schema.Struct({
  architecture: Schema.optional(BuildArchitecture),
  base: Schema.optional(BasePath),
})

// Advanced configuration
const AdvancedConfig = Schema.Struct({
  isSelfContainedMode: Schema.optional(Schema.Boolean),
  debug: Schema.optional(Schema.Boolean),
  vite: Schema.optional(Schema.Unknown), // Vite.UserConfig
})

// Data source types
const DataSourceType = Schema.Literal(`file`, `directory`, `memory`, `data`)

// Schema config (from Schema.Config)
const SchemaConfig = Schema.Struct({
  enabled: Schema.optional(Schema.Boolean),
  useDataSources: Schema.optional(Schema.Union(
    Schema.mutable(Schema.Array(DataSourceType)),
    Schema.Null,
  )),
  dataSources: Schema.optional(Schema.Struct({
    file: Schema.optional(Schema.Unknown), // DataSources.SchemaFile.ConfigInput
    directory: Schema.optional(Schema.Unknown), // DataSources.SchemaDirectory.ConfigInput
    memory: Schema.optional(Schema.Unknown), // DataSources.Memory.ConfigInput
    data: Schema.optional(Schema.Unknown), // Schema
  })),
  // Note: projectRoot is omitted from ConfigInput as per the type definition
})

// Main config schema
export const ConfigInputSchema = Schema.Struct({
  root: Schema.optional(Schema.String),
  schema: Schema.optional(SchemaConfig),
  schemaAugmentations: Schema.optional(Schema.mutable(Schema.Array(Schema.Unknown))),
  templateVariables: Schema.optional(TemplateVariables),
  build: Schema.optional(BuildConfig),
  advanced: Schema.optional(AdvancedConfig),
})

// Extract the inferred type
export type ConfigInput = Schema.Schema.Type<typeof ConfigInputSchema>

// Export BuildArchitecture type for compatibility
export type BuildArchitecture = Schema.Schema.Type<typeof BuildArchitecture>

// Verify type compatibility with existing interface
// Comment out the following lines after verification
// import type { ConfigInput as ExistingConfigInput } from './configurator.js'
// type _AssertCompatible<T extends ExistingConfigInput> = T
// type _Check = _AssertCompatible<ConfigInput>
