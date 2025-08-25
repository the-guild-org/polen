import type { Vite } from '#dep/vite/index'
import { assertPathAbsolute } from '#lib/kit-temp'
import { type PackagePaths, packagePaths } from '#package-paths'
import { Err, Manifest, Path, Str } from '@wollybeard/kit'
import { z } from 'zod'
import type { Schema } from '../schema/$.js'

export const BuildArchitectureEnum = {
  ssg: `ssg`,
  spa: `spa`,
  ssr: `ssr`,
} as const

export const BuildArchitecture = z.nativeEnum(BuildArchitectureEnum)

export type BuildArchitecture = typeof BuildArchitectureEnum[keyof typeof BuildArchitectureEnum]

type SchemaConfigInput = Omit<Schema.Config, `projectRoot`>

/**
 * Polen configuration input.
 *
 * All options are optional. Polen provides sensible defaults for a great developer experience out of the box.
 */
export interface ConfigInput {
  /**
   * Configuration for how Polen loads your GraphQL schema.
   *
   * Polen supports multiple schema sources:
   * - `file` - Load from a single SDL file (default: schema.graphql)
   * - `directory` - Load multiple SDL files with date prefixes (enables changelog)
   * - `memory` - Define schemas programmatically in configuration
   * - `introspection` - Fetch schema from a GraphQL endpoint
   * - `data` - Use pre-built schema objects
   *
   * @example
   * ```ts
   * // Default: looks for schema.graphql
   * schema: {}
   *
   * // Load via introspection
   * schema: {
   *   dataSources: {
   *     introspection: {
   *       url: 'https://api.example.com/graphql',
   *       headers: { 'Authorization': `Bearer ${process.env.API_TOKEN}` }
   *     }
   *   }
   * }
   *
   * // Multiple versions for changelog
   * schema: {
   *   dataSources: {
   *     directory: { path: './schema' }
   *   }
   * }
   *
   * // Custom source order
   * schema: {
   *   useDataSources: ['introspection', 'file'],
   *   dataSources: {
   *     introspection: { url: 'https://api.example.com/graphql' },
   *     file: { path: './fallback.graphql' }
   *   }
   * }
   * ```
   *
   * **Two introspection features**:
   * 1. **File Convention**: Polen auto-detects `schema.introspection.json` files
   * 2. **Config-driven**: Polen fetches and caches introspection for you
   *
   * **Interoperability**: The `schema.introspection.json` file uses the standard
   * GraphQL introspection format, compatible with GraphQL Codegen, Apollo CLI, etc.
   *
   * **Lifecycle**:
   * - First run: Fetches from endpoint, saves to `schema.introspection.json`
   * - Subsequent runs: Loads from JSON file (no network request)
   * - To refresh: Delete the JSON file
   * - Runs during `polen dev` and `polen build`, never at runtime
   *
   * **Query details**: Uses the standard introspection query from the GraphQL spec
   * @see https://spec.graphql.org/draft/#sec-Introspection
   */
  schema?: SchemaConfigInput | undefined
  templateVariables?: {
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
    title?: string | undefined
  } | undefined
  /**
   * Build configuration for your developer portal.
   */
  build?: {
    /**
     * The build architecture for your developer portal.
     *
     * - `ssg` - Static Site Generation: Pre-renders all pages at build time. Best for public docs.
     * - `ssr` - Server-Side Rendering: Renders pages on each request. Enables dynamic features.
     * - `spa` - Single Page Application: Client-side rendering only.
     *
     * @default 'ssg'
     */
    architecture?: BuildArchitecture | undefined
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
    base?: string | undefined
  } | undefined
  /**
   * Server configuration for development and production.
   */
  server?: {
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
    port?: number | undefined
  } | undefined
  /**
   * Configuration for developer experience warnings.
   *
   * Polen can show helpful warnings for common issues or misconfigurations.
   * Each warning type can be individually enabled or disabled.
   *
   * @example
   * ```ts
   * warnings: {
   *   interactiveWithoutSchema: {
   *     enabled: false // Disable warning when interactive code blocks are used without a schema
   *   }
   * }
   * ```
   */
  warnings?: {
    /**
     * Warning shown when GraphQL code blocks have the `interactive` flag
     * but no schema is configured.
     *
     * Interactive features require a schema to provide field validation,
     * type information, and auto-completion.
     *
     * @default { enabled: true }
     */
    interactiveWithoutSchema?: {
      /**
       * Whether to show this warning.
       *
       * @default true
       */
      enabled?: boolean | undefined
    } | undefined
  } | undefined
  /**
   * Advanced configuration options.
   *
   * These settings are for advanced use cases and debugging.
   */
  advanced?: {
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
    explorer?: boolean | undefined
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
    isSelfContainedMode?: boolean | undefined
    /**
     * Whether to enable debug mode.
     *
     * When enabled the following happens:
     *
     * - build output is NOT minified.
     *
     * @default false
     */
    debug?: boolean | undefined
    /**
     * Additional {@link vite.UserConfig} that is merged with the one created by Polen using {@link Vite.mergeConfig}.
     *
     * @see https://vite.dev/config/
     * @see https://vite.dev/guide/api-javascript.html#mergeconfig
     */
    vite?: Vite.UserConfig | undefined
    paths?: ConfigAdvancedPathsInput
  } | undefined
}

export interface ConfigAdvancedPathsInput {
  devAssets?: string
}

export interface TemplateVariables {
  title: string
}

const buildPaths = (rootDir: string, overrides?: ConfigAdvancedPathsInput): Config[`paths`] => {
  if (!Path.isAbsolute(rootDir)) throw new Error(`Root dir path must be absolute: ${rootDir}`)
  const rootAbsolute = Path.ensureAbsoluteWith(rootDir)

  const buildAbsolutePath = rootAbsolute(`build`)
  const buildAbsolute = Path.ensureAbsoluteWith(buildAbsolutePath)

  const publicAbsolutePath = rootAbsolute(`public`)
  const publicAbsolute = Path.ensureAbsoluteWith(publicAbsolutePath)

  const assetsAbsolute = Path.ensureAbsoluteWith(buildAbsolute(`assets`))

  // Dev assets paths
  let devAssetsRelative = 'node_modules/.vite/polen-assets'
  let devAssetsAbsolute = Path.join(rootDir, devAssetsRelative)
  if (overrides?.devAssets) {
    devAssetsRelative = Path.relative(rootDir, overrides?.devAssets)
    devAssetsAbsolute = overrides?.devAssets
  }

  return {
    project: {
      rootDir,
      relative: {
        build: {
          root: `build`,
          relative: {
            serverEntrypoint: `app.js`,
            assets: {
              root: `assets`,
              relative: {
                schemas: `schemas`,
              },
            },
          },
        },
        pages: `pages`,
        public: {
          root: `public`,
          logo: `logo.svg`,
        },
      },
      absolute: {
        pages: rootAbsolute(`pages`),
        build: {
          root: buildAbsolute(`.`),
          serverEntrypoint: buildAbsolute(`app.js`),
          assets: {
            root: buildAbsolute(`assets`),
            schemas: assetsAbsolute(`schemas`),
          },
        },
        public: {
          root: publicAbsolute(`.`),
          logo: publicAbsolute(`logo.svg`),
        },
      },
    },
    framework: {
      ...packagePaths,
      devAssets: {
        relative: devAssetsRelative,
        absolute: devAssetsAbsolute,
        schemas: Path.join(devAssetsAbsolute, 'schemas'),
      },
    },
  }
}

export interface Config {
  _input: ConfigInput
  build: {
    architecture: BuildArchitecture
    base: string
  }
  server: {
    port: number
    routes: {
      assets: string
    }
  }
  templateVariables: TemplateVariables
  schema: null | SchemaConfigInput
  ssr: {
    enabled: boolean
  }
  warnings: {
    interactiveWithoutSchema: {
      enabled: boolean
    }
  }
  paths: {
    project: {
      rootDir: string
      relative: {
        build: {
          root: string
          relative: {
            assets: {
              root: string
              relative: {
                schemas: string
              }
            }
            serverEntrypoint: string
          }
        }
        pages: string
        public: {
          root: string
          logo: string
        }
      }
      absolute: {
        build: {
          root: string
          assets: {
            root: string
            schemas: string
          }
          serverEntrypoint: string
        }
        pages: string
        public: {
          root: string
          logo: string
        }
      }
    }
    framework: PackagePaths & {
      devAssets: {
        relative: string
        absolute: string
        schemas: string
      }
    }
  }
  advanced: {
    isSelfContainedMode: boolean
    explorer: boolean
    debug: boolean
    vite?: Vite.UserConfig | undefined
  }
}

const configInputDefaults: Config = {
  _input: {},
  templateVariables: {
    title: `My Developer Portal`,
  },
  build: {
    architecture: BuildArchitecture.enum.ssg,
    base: `/`,
  },
  server: {
    port: 3000,
    routes: {
      assets: '/assets',
    },
  },
  schema: null,
  ssr: {
    enabled: true,
  },
  warnings: {
    interactiveWithoutSchema: {
      enabled: true,
    },
  },
  paths: buildPaths(process.cwd()),
  advanced: {
    isSelfContainedMode: false,
    debug: false,
    explorer: false,
  },
}

export const normalizeInput = async (
  configInput: ConfigInput | undefined,
  /**
   * If the input has a relative root path, then resolve it relative to this path.
   *
   * We tell users relative paths are resolved to the config file directory.
   * Config loaders should pass the directory of the config file here to ensure that happens.
   *
   * If this is omitted, then relative root paths will throw an error.
   */
  baseRootDirPath: string,
): Promise<Config> => {
  assertPathAbsolute(baseRootDirPath)

  const config = structuredClone(configInputDefaults)

  if (configInput) {
    config._input = configInput
  }

  if (configInput?.build?.architecture) {
    config.build.architecture = configInput.build.architecture
  }

  if (configInput?.build?.base !== undefined) {
    // Validate base path
    const base = configInput.build.base
    if (!base.startsWith(`/`)) {
      throw new Error(`Base path must start with "/". Provided: ${base}`)
    }
    if (!base.endsWith(`/`)) {
      throw new Error(`Base path must end with "/". Provided: ${base}`)
    }
    config.build.base = base
  }

  if (configInput?.advanced?.debug !== undefined) {
    config.advanced.debug = configInput.advanced.debug
  }

  // Always use the baseRootDirPath as the project root
  // This is either the --project directory or the config file directory
  config.paths = buildPaths(baseRootDirPath, configInput?.advanced?.paths)

  // Try to read package.json name as fallback for title
  if (!configInput?.templateVariables?.title) {
    const packageJson = await Manifest.resource.read(config.paths.project.rootDir)

    // todo: let the user know there was an error...
    if (!Err.is(packageJson) && packageJson.name) {
      // Package name will be used as default, but can still be overridden below
      config.templateVariables.title = Str.Case.title(packageJson.name)
    }
  }

  if (configInput?.advanced?.vite) {
    config.advanced.vite = configInput.advanced.vite
  }

  if (configInput?.templateVariables?.title !== undefined) {
    config.templateVariables.title = configInput.templateVariables.title
  }

  if (configInput?.schema) {
    config.schema = configInput.schema
  }

  if (configInput?.advanced?.isSelfContainedMode !== undefined) {
    config.advanced.isSelfContainedMode = configInput.advanced.isSelfContainedMode
  }

  if (configInput?.advanced?.explorer !== undefined) {
    config.advanced.explorer = configInput.advanced.explorer
  }

  if (configInput?.server?.port !== undefined) {
    config.server.port = configInput.server.port
  }

  // Server routes are not configurable by users yet, use defaults
  // config.server.routes is already set from defaultConfig

  // Process warnings configuration
  if (configInput?.warnings?.interactiveWithoutSchema?.enabled !== undefined) {
    config.warnings.interactiveWithoutSchema.enabled = configInput.warnings.interactiveWithoutSchema.enabled
  }

  return config
}
