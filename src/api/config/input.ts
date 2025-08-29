import { Schema } from '#api/schema/$'
import { Vite } from '#dep/vite/index'
import { spreadShallow } from '#lib/kit-temp'
import { S } from '#lib/kit-temp/effect'
import type { WritableDeep } from 'type-fest'

// ============================================================================
// Schema - Build
// ============================================================================

export const BuildArchitecture = S.Enums(
  {
    ssg: 'ssg',
    spa: 'spa',
    ssr: 'ssr',
  } as const,
)
export type BuildArchitecture = S.Schema.Type<typeof BuildArchitecture>

// ============================================================================
// Schema - Template Variables
// ============================================================================

const TemplateVariablesSchema = S.Struct({
  /**
   * Title of the app.
   *
   * Used in the navigation bar and in the title tag.
   *
   * If not provided, Polen will try to use your project's package.json name
   * field, converting it to title case (e.g., "my-project" → "My Project").
   *
   * @default Your package.json name (title-cased) or "My Developer Portal"
   * @example
   * ```ts
   * // Explicit title
   * title: 'Acme GraphQL API'
   *
   * // Falls back to package.json name
   * // If package.json has { "name": "acme-graphql" }
   * // Title will be "Acme Graphql"
   * ```
   */
  title: S.optional(S.String),
}).annotations({
  identifier: 'TemplateVariables',
  description: 'Template variables for customizing the developer portal.',
})
export type TemplateVariables = S.Schema.Type<typeof TemplateVariablesSchema>

// ============================================================================
// Schema - Build Config
// ============================================================================

const BuildConfigSchema = S.Struct({
  /**
   * The build architecture for your developer portal.
   *
   * - `ssg` - Static Site Generation: Pre-renders all pages at build time. Best for public docs.
   * - `ssr` - Server-Side Rendering: Renders pages on each request. Enables dynamic features.
   * - `spa` - Single Page Application: Client-side rendering only.
   *
   * @default 'ssg'
   */
  architecture: S.optional(BuildArchitecture),
  /**
   * Base public path for the deployed site.
   *
   * Use this when deploying to a subdirectory (e.g., GitHub Pages project sites).
   *
   * @example
   * ```ts
   * // Deploy to root
   * base: '/'
   *
   * // Deploy to subdirectory
   * base: '/my-project/'
   *
   * // PR preview deployments
   * base: '/pr-123/'
   * ```
   *
   * Must start and end with `/`.
   *
   * @default `/`
   */
  base: S.optional(S.String),
}).annotations({
  identifier: 'BuildConfig',
  description: 'Build configuration for your developer portal.',
})

// ============================================================================
// Schema - Server Config
// ============================================================================

const ServerConfigSchema = S.Struct({
  /**
   * Port for the server to listen on.
   *
   * - In development: The port for the Vite dev server
   * - In production SSR: The default port for the Node.js server
   *
   * For production SSR builds, this can be overridden at runtime
   * using the PORT environment variable.
   *
   * @default 3000
   * @example
   * ```ts
   * // Use a specific port
   * server: {
   *   port: 4000
   * }
   *
   * // Or via CLI flags:
   * // polen dev --port 4000
   * // polen build --port 4000
   * ```
   */
  port: S.optional(S.Number),
}).annotations({
  identifier: 'ServerConfig',
  description: 'Server configuration for development and production.',
})

// ============================================================================
// Schema - Warnings Config
// ============================================================================

const WarningsConfigSchema = S.Struct({
  /**
   * Warning shown when GraphQL code blocks have the `interactive` flag
   * but no schema is configured.
   *
   * Interactive features require a schema to provide field validation,
   * type information, and auto-completion.
   *
   * @default { enabled: true }
   */
  interactiveWithoutSchema: S.optional(
    S.Struct({
      /**
       * Whether to show this warning.
       *
       * @default true
       */
      enabled: S.optional(S.Boolean),
    }),
  ),
}).annotations({
  identifier: 'WarningsConfig',
  description:
    `Configuration for developer experience warnings. Polen can show helpful warnings for common issues or misconfigurations. Each warning type can be individually enabled or disabled.

@example
\`\`\`ts
warnings: {
  interactiveWithoutSchema: {
    enabled: false // Disable warning when interactive code blocks are used without a schema
  }
}
\`\`\``,
})

// ============================================================================
// Schema - Advanced Config
// ============================================================================

const AdvancedPathsSchema = S.Struct({
  devAssets: S.optional(S.String),
})

const AdvancedConfigSchema = S.Struct({
  /**
   * Enable a special module explorer for the source code that Polen assembles for your app.
   *
   * This opens an interactive UI to inspect the module graph and transformations.
   * Useful for debugging build issues or understanding Polen's internals.
   *
   * Access the explorer at `/__inspect/` when running the dev server.
   *
   * Powered by [Vite Inspect](https://github.com/antfu-collective/vite-plugin-inspect).
   *
   * @default false
   */
  explorer: S.optional(S.Boolean),
  /**
   * Force the CLI to resolve Polen imports in your project to itself rather than
   * to what you have installed in your project.
   *
   * If you are using a Polen CLI from your local project against your local project
   * then there can be no effect from this setting.
   *
   * This is mostly useful for:
   *
   * - Development of Polen itself
   * - Global CLI usage against ephemeral projects e.g. a directory with just a
   *   GraphQL Schema file.
   *
   * @default false
   */
  isSelfContainedMode: S.optional(S.Boolean),
  /**
   * Whether to enable debug mode.
   *
   * When enabled the following happens:
   *
   * - build output is NOT minified.
   *
   * @default false
   */
  debug: S.optional(S.Boolean),
  /**
   * Additional {@link vite.UserConfig} that is merged with the one created by Polen using {@link Vite.mergeConfig}.
   *
   * @see https://vite.dev/config/
   * @see https://vite.dev/guide/api-javascript.html#mergeconfig
   */
  vite: S.optional(S.transform(
    S.Unknown,
    S.Any, // or S.typeSchema<Vite.UserConfig>() if you have the type
    {
      decode: (value) => value as Vite.UserConfig,
      encode: (value) => value,
    },
  )),
  paths: S.optional(AdvancedPathsSchema),
}).annotations({
  identifier: 'AdvancedConfig',
  description: 'Advanced configuration options. These settings are for advanced use cases and debugging.',
})

// ============================================================================
// Schema - Main Config Input
// ============================================================================

/**
 * Polen configuration input.
 *
 * All options are optional. Polen provides sensible defaults for a great developer experience out of the box.
 */
export const ConfigInputSchema = S.Struct({
  schema: S.optional(Schema.ConfigSchema.ConfigSchema),
  templateVariables: S.optional(TemplateVariablesSchema),
  build: S.optional(BuildConfigSchema),
  server: S.optional(ServerConfigSchema),
  warnings: S.optional(WarningsConfigSchema),
  advanced: S.optional(AdvancedConfigSchema),
}).annotations({
  identifier: 'ConfigInput',
  title: 'Polen Configuration',
  description: 'Configuration for your Polen developer portal. All options are optional with sensible defaults.',
})

export type ConfigInput = S.Schema.Type<typeof ConfigInputSchema>

// ============================================================================
// Codecs
// ============================================================================

export const decodeConfigInput = S.decodeSync(ConfigInputSchema)
export const validateConfigInput = S.validateSync(ConfigInputSchema)
export const validateConfigInputEffect = S.validate(ConfigInputSchema)

// -- merge
//
//

/**
 * Deep merge two Polen config inputs.
 * The second config (overrides) takes precedence over the first (base).
 */
export const mergeInputs = (
  base?: ConfigInput | undefined,
  overrides?: ConfigInput | undefined,
): ConfigInput => {
  const base_as_writable = base as WritableDeep<ConfigInput> | undefined
  const overrides_as_writable = overrides as WritableDeep<ConfigInput> | undefined

  if (!base_as_writable) {
    return overrides_as_writable ?? {}
  }

  if (!overrides_as_writable) {
    return base_as_writable ?? {}
  }

  const merged: WritableDeep<ConfigInput> = spreadShallow(base_as_writable, overrides_as_writable)

  // Merge schema if both have it
  if (base_as_writable.schema ?? overrides_as_writable.schema) {
    merged.schema = overrides_as_writable.schema ?? base_as_writable.schema
  }

  // Merge build config
  if (base_as_writable.build ?? overrides_as_writable.build) {
    merged.build = spreadShallow(base_as_writable.build, overrides_as_writable.build)
  }

  // Merge server config
  if (base_as_writable.server ?? overrides_as_writable.server) {
    merged.server = spreadShallow(base_as_writable.server, overrides_as_writable.server)
  }

  // Merge warnings config
  if (base_as_writable.warnings ?? overrides_as_writable.warnings) {
    merged.warnings = spreadShallow(base_as_writable.warnings, overrides_as_writable.warnings)

    // Merge interactiveWithoutSchema config
    if (
      base_as_writable.warnings?.interactiveWithoutSchema ?? overrides_as_writable.warnings?.interactiveWithoutSchema
    ) {
      merged.warnings.interactiveWithoutSchema = spreadShallow(
        base_as_writable.warnings?.interactiveWithoutSchema,
        overrides_as_writable.warnings?.interactiveWithoutSchema,
      )
    }
  }

  // Merge advanced config
  if (base_as_writable.advanced ?? overrides_as_writable.advanced) {
    merged.advanced = spreadShallow(base_as_writable.advanced, overrides_as_writable.advanced)

    // Merge Vite configs if present
    if (base_as_writable.advanced?.vite ?? overrides_as_writable.advanced?.vite) {
      merged.advanced.vite = Vite.mergeConfig(
        base_as_writable.advanced?.vite ?? {},
        overrides_as_writable.advanced?.vite ?? {},
      )
    }

    if (base_as_writable.advanced?.paths ?? overrides_as_writable.advanced?.paths) {
      merged.advanced.paths = spreadShallow(base_as_writable.advanced?.paths, overrides_as_writable.advanced?.paths)
    }
  }

  return merged
}

export const defineConfig = ConfigInputSchema.make
