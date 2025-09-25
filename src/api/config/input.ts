import { ExamplesConfig } from '#api/examples/config'
import { ReferenceConfig } from '#api/reference/config'
import { ConfigSchema } from '#api/schema/config-schema'
import { S } from '#dep/effect'
import { Vite } from '#dep/vite/index'
import { FsLoc, Obj } from '@wollybeard/kit'
import type { WritableDeep } from 'type-fest'
import { HomeConfig } from './home.js'
import { ThemeConfig } from './theme.js'

// ============================================================================
// Build
// ============================================================================

export const BuildArchitecture = S.Enums(
  {
    ssg: 'ssg',
    spa: 'spa',
    ssr: 'ssr',
  } as const,
)
export type BuildArchitecture = typeof BuildArchitecture.Type

// ============================================================================
// Template Variables
// ============================================================================

const TemplateVariables = S.Struct({
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
export type TemplateVariables = typeof TemplateVariables.Type

// ============================================================================
// Build Config
// ============================================================================

const BuildConfig = S.Struct({
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
// Server Config
// ============================================================================

const ServerConfig = S.Struct({
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
// Warnings Config
// ============================================================================

const WarningsConfig = S.Struct({
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
// Branding Config
// ============================================================================

const BrandingConfig = S.Struct({
  /**
   * Specifies which theme mode the single logo.* file is designed for.
   *
   * This setting only applies when you provide a single logo file (e.g., `logo.svg`).
   * It tells Polen whether your logo was designed for light or dark backgrounds,
   * so it can automatically invert the logo colors when needed.
   *
   * When you provide theme-specific logos (`logo-light.svg` and `logo-dark.svg`),
   * this setting is ignored as each logo is used directly for its respective theme.
   *
   * @default 'light'
   *
   * @example
   * ```ts
   * // Default: Your logo.svg has dark graphics for light backgrounds
   * branding: {
   *   // logoDesignedFor: 'light' // This is the default
   * }
   *
   * // Your logo.svg has light/white graphics for dark backgrounds
   * branding: {
   *   logoDesignedFor: 'dark'
   * }
   * ```
   */
  logoDesignedFor: S.optional(S.Literal('light', 'dark')),
}).annotations({
  identifier: 'BrandingConfig',
  description: 'Branding configuration for customizing visual identity elements.',
})

// ============================================================================
// Advanced Config
// ============================================================================

const AdvancedPaths = S.Struct({
  devAssets: S.optional(S.Union(
    S.String,
    FsLoc.AbsDir,
    FsLoc.RelDir,
  )),
})

const AdvancedConfig = S.Struct({
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
  paths: S.optional(AdvancedPaths),
}).annotations({
  identifier: 'AdvancedConfig',
  description: 'Advanced configuration options. These settings are for advanced use cases and debugging.',
})

// ============================================================================
// ConfigInput
// ============================================================================

/**
 * Polen configuration input.
 *
 * All options are optional. Polen provides sensible defaults for a great developer experience out of the box.
 */
export const ConfigInput = S.Struct({
  /**
   * Name of your API/project.
   *
   * This is used as the default for:
   * - Hero section title (unless overridden in home.hero.title)
   * - Navigation bar title (unless overridden in templateVariables.title)
   * - Page title suffix
   *
   * @example
   * ```ts
   * name: 'Pokemon API'
   * ```
   */
  name: S.optional(S.String),
  /**
   * Description of your API/project.
   *
   * This is used as the default for:
   * - Hero section description (unless overridden in home.hero.description)
   * - Meta description tags for SEO
   *
   * @example
   * ```ts
   * description: 'Catch, train, and battle with Pokemon through our comprehensive GraphQL API'
   * ```
   */
  description: S.optional(S.String),
  schema: S.optional(ConfigSchema),
  reference: S.optional(ReferenceConfig),
  examples: S.optional(ExamplesConfig),
  templateVariables: S.optional(TemplateVariables),
  home: S.optional(HomeConfig),
  theme: S.optional(ThemeConfig),
  branding: S.optional(BrandingConfig),
  build: S.optional(BuildConfig),
  server: S.optional(ServerConfig),
  warnings: S.optional(WarningsConfig),
  advanced: S.optional(AdvancedConfig),
}).annotations({
  identifier: 'ConfigInput',
  title: 'Polen Configuration',
  description: 'Configuration for your Polen developer portal. All options are optional with sensible defaults.',
})

export type ConfigInput = typeof ConfigInput.Type

// ============================================================================
// Codecs
// ============================================================================

export const decodeConfigInput = S.decodeSync(ConfigInput)
export const validateConfigInput = S.validateSync(ConfigInput)
export const validateConfigInputEffect = S.validate(ConfigInput)

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

  const merged: WritableDeep<ConfigInput> = Obj.spreadShallow(base_as_writable, overrides_as_writable)

  // Merge schema if both have it
  if (base_as_writable.schema ?? overrides_as_writable.schema) {
    merged.schema = overrides_as_writable.schema ?? base_as_writable.schema
  }

  // Merge examples config
  if (base_as_writable.examples ?? overrides_as_writable.examples) {
    merged.examples = Obj.spreadShallow(base_as_writable.examples, overrides_as_writable.examples)
  }

  // Merge home config
  if (base_as_writable.home ?? overrides_as_writable.home) {
    merged.home = Obj.spreadShallow(base_as_writable.home, overrides_as_writable.home)
  }

  // Merge theme config
  if (base_as_writable.theme ?? overrides_as_writable.theme) {
    merged.theme = Obj.spreadShallow(base_as_writable.theme, overrides_as_writable.theme)

    // Merge nested theme colors if both have them
    if (base_as_writable.theme?.colors ?? overrides_as_writable.theme?.colors) {
      merged.theme = {
        ...merged.theme,
        colors: Obj.spreadShallow(base_as_writable.theme?.colors, overrides_as_writable.theme?.colors),
      }
    }
  }

  // Merge branding config
  if (base_as_writable.branding ?? overrides_as_writable.branding) {
    merged.branding = Obj.spreadShallow(base_as_writable.branding, overrides_as_writable.branding)
  }

  // Merge build config
  if (base_as_writable.build ?? overrides_as_writable.build) {
    merged.build = Obj.spreadShallow(base_as_writable.build, overrides_as_writable.build)
  }

  // Merge server config
  if (base_as_writable.server ?? overrides_as_writable.server) {
    merged.server = Obj.spreadShallow(base_as_writable.server, overrides_as_writable.server)
  }

  // Merge warnings config
  if (base_as_writable.warnings ?? overrides_as_writable.warnings) {
    merged.warnings = Obj.spreadShallow(base_as_writable.warnings, overrides_as_writable.warnings)

    // Merge interactiveWithoutSchema config
    if (
      base_as_writable.warnings?.interactiveWithoutSchema ?? overrides_as_writable.warnings?.interactiveWithoutSchema
    ) {
      merged.warnings.interactiveWithoutSchema = Obj.spreadShallow(
        base_as_writable.warnings?.interactiveWithoutSchema,
        overrides_as_writable.warnings?.interactiveWithoutSchema,
      )
    }
  }

  // Merge advanced config
  if (base_as_writable.advanced ?? overrides_as_writable.advanced) {
    merged.advanced = Obj.spreadShallow(base_as_writable.advanced, overrides_as_writable.advanced)

    // Merge Vite configs if present
    if (base_as_writable.advanced?.vite ?? overrides_as_writable.advanced?.vite) {
      merged.advanced.vite = Vite.mergeConfig(
        base_as_writable.advanced?.vite ?? {},
        overrides_as_writable.advanced?.vite ?? {},
      )
    }

    if (base_as_writable.advanced?.paths ?? overrides_as_writable.advanced?.paths) {
      merged.advanced.paths = Obj.spreadShallow(base_as_writable.advanced?.paths, overrides_as_writable.advanced?.paths)
    }
  }

  return merged
}

export const defineConfig = ConfigInput.make
