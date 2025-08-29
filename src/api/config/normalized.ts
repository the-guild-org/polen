import { Schema } from '#api/schema/$'
import { assertPathAbsolute } from '#lib/kit-temp'
import { S } from '#lib/kit-temp/effect'
import { packagePaths } from '#package-paths'
import { Err, Manifest, Path, Str } from '@wollybeard/kit'
import { Effect } from 'effect'
import type { WritableDeep } from 'type-fest'
import { BuildArchitecture, type ConfigInput, ConfigInputSchema } from './input.js'

// ============================================================================
// Schema - Template Variables
// ============================================================================

const TemplateVariablesSchema = S.Struct({
  title: S.String,
}).annotations({
  identifier: 'TemplateVariablesNormalized',
  description: 'Normalized template variables with resolved defaults.',
})

export type TemplateVariables = S.Schema.Type<typeof TemplateVariablesSchema>

// ============================================================================
// Schema - Package Paths
// ============================================================================

const PackagePathsSchema = S.Struct({
  name: S.String,
  isRunningFromSource: S.Boolean,
  static: S.Struct({
    source: S.String,
    build: S.String,
  }),
  rootDir: S.String,
  sourceExtension: S.Union(S.Literal('.js'), S.Literal('.ts')),
  sourceDir: S.String,
  template: S.Struct({
    absolute: S.Struct({
      rootDir: S.String,
      server: S.Struct({
        app: S.String,
        entrypoint: S.String,
      }),
      client: S.Struct({
        entrypoint: S.String,
      }),
    }),
    relative: S.Struct({
      rootDir: S.String,
      server: S.Struct({
        app: S.String,
        entrypoint: S.String,
      }),
      client: S.Struct({
        entrypoint: S.String,
      }),
    }),
  }),
}).annotations({
  identifier: 'PackagePaths',
  description: 'Polen package paths configuration.',
})

// ============================================================================
// Schema - Paths
// ============================================================================

const ProjectPathsSchema = S.Struct({
  rootDir: S.String,
  relative: S.Struct({
    build: S.Struct({
      root: S.String,
      relative: S.Struct({
        assets: S.Struct({
          root: S.String,
          relative: S.Struct({
            schemas: S.String,
          }),
        }),
        serverEntrypoint: S.String,
      }),
    }),
    pages: S.String,
    public: S.Struct({
      root: S.String,
      logo: S.String,
    }),
  }),
  absolute: S.Struct({
    build: S.Struct({
      root: S.String,
      assets: S.Struct({
        root: S.String,
        schemas: S.String,
      }),
      serverEntrypoint: S.String,
    }),
    pages: S.String,
    public: S.Struct({
      root: S.String,
      logo: S.String,
    }),
  }),
}).annotations({
  identifier: 'ProjectPaths',
  description: 'Project paths for build, pages, and public assets.',
})

const FrameworkPathsSchema = S.extend(
  PackagePathsSchema,
  S.Struct({
    devAssets: S.Struct({
      relative: S.String,
      absolute: S.String,
      schemas: S.String,
    }),
  }),
).annotations({
  identifier: 'FrameworkPaths',
  description: 'Framework paths including dev assets.',
})

const PathsSchema = S.Struct({
  project: ProjectPathsSchema,
  framework: FrameworkPathsSchema,
}).annotations({
  identifier: 'Paths',
  description: 'Complete paths configuration for project and framework.',
})

// ============================================================================
// Schema - Main Config
// ============================================================================

/**
 * Normalized Polen configuration with all defaults resolved.
 *
 * This represents the fully processed configuration after:
 * - Applying defaults for all optional fields
 * - Computing derived paths
 * - Resolving package.json fallbacks
 */
export const ConfigSchema = S.Struct({
  /**
   * The original user input configuration.
   */
  _input: S.suspend(() => ConfigInputSchema),

  /**
   * Build configuration with resolved defaults.
   */
  build: S.Struct({
    architecture: S.suspend(() => BuildArchitecture),
    base: S.String,
  }),

  /**
   * Server configuration with resolved defaults.
   */
  server: S.Struct({
    port: S.Number,
    routes: S.Struct({
      assets: S.String,
    }),
  }),

  /**
   * Template variables with resolved defaults.
   */
  templateVariables: TemplateVariablesSchema,

  /**
   * Schema configuration or null if disabled.
   */
  schema: S.Union(S.Null, Schema.ConfigSchema.ConfigSchema),

  /**
   * SSR configuration.
   */
  ssr: S.Struct({
    enabled: S.Boolean,
  }),

  /**
   * Warnings configuration with resolved defaults.
   */
  warnings: S.Struct({
    interactiveWithoutSchema: S.Struct({
      enabled: S.Boolean,
    }),
  }),

  /**
   * Computed paths for project and framework.
   */
  paths: PathsSchema,

  /**
   * Advanced configuration with resolved defaults.
   */
  advanced: S.Struct({
    isSelfContainedMode: S.Boolean,
    explorer: S.Boolean,
    debug: S.Boolean,
    vite: S.optional(S.Unknown), // Vite.UserConfig
  }),
}).annotations({
  identifier: 'Config',
  title: 'Normalized Configuration',
  description: 'The fully resolved Polen configuration with all defaults applied and paths computed.',
})

// ============================================================================
// Type Export
// ============================================================================

/**
 * The normalized configuration type derived from the schema.
 */
export type Config = S.Schema.Type<typeof ConfigSchema>

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decode(ConfigSchema)
export const encode = S.encode(ConfigSchema)
export const validate = S.validate(ConfigSchema)

// -------------

export interface ConfigAdvancedPathsInput {
  devAssets?: string | undefined
}

const buildPaths = (rootDir: string, overrides?: ConfigAdvancedPathsInput | undefined): Config[`paths`] => {
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

const getConfigInputDefaults = (): Config => ({
  _input: {},
  templateVariables: {
    title: `My Developer Portal`,
  },
  build: {
    architecture: BuildArchitecture.enums.ssg,
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
})

export const normalizeInput = (
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
): Effect.Effect<Config, Error, never> =>
  Effect.gen(function*() {
    assertPathAbsolute(baseRootDirPath)

    const configInput_as_writeable = configInput as WritableDeep<ConfigInput> | undefined
    const config = structuredClone(getConfigInputDefaults()) as WritableDeep<Config>

    if (configInput_as_writeable) {
      config._input = configInput_as_writeable
    }

    if (configInput_as_writeable?.build?.architecture) {
      config.build.architecture = configInput_as_writeable.build.architecture
    }

    if (configInput_as_writeable?.build?.base !== undefined) {
      // Validate base path
      const base = configInput_as_writeable.build.base
      if (!base.startsWith(`/`)) {
        throw new Error(`Base path must start with "/". Provided: ${base}`)
      }
      if (!base.endsWith(`/`)) {
        throw new Error(`Base path must end with "/". Provided: ${base}`)
      }
      config.build.base = base
    }

    if (configInput_as_writeable?.advanced?.debug !== undefined) {
      config.advanced.debug = configInput_as_writeable.advanced.debug
    }

    // Always use the baseRootDirPath as the project root
    // This is either the --project directory or the config file directory
    config.paths = buildPaths(baseRootDirPath, configInput_as_writeable?.advanced?.paths)

    // Try to read package.json name as fallback for title
    if (!configInput_as_writeable?.templateVariables?.title) {
      const packageJson = yield* Effect.tryPromise({
        try: () => Manifest.resource.read(config.paths.project.rootDir),
        catch: (error) => new Error(`Failed to read package.json: ${error}`),
      })

      // todo: let the user know there was an error...
      if (!Err.is(packageJson) && packageJson.name) {
        // Package name will be used as default, but can still be overridden below
        config.templateVariables.title = Str.Case.title(packageJson.name)
      }
    }

    if (configInput_as_writeable?.advanced?.vite) {
      config.advanced.vite = configInput_as_writeable.advanced.vite
    }

    if (configInput_as_writeable?.templateVariables?.title !== undefined) {
      config.templateVariables.title = configInput_as_writeable.templateVariables.title
    }

    if (configInput_as_writeable?.schema) {
      config.schema = configInput_as_writeable.schema
    }

    if (configInput_as_writeable?.advanced?.isSelfContainedMode !== undefined) {
      config.advanced.isSelfContainedMode = configInput_as_writeable.advanced.isSelfContainedMode
    }

    if (configInput_as_writeable?.advanced?.explorer !== undefined) {
      config.advanced.explorer = configInput_as_writeable.advanced.explorer
    }

    if (configInput_as_writeable?.server?.port !== undefined) {
      config.server.port = configInput_as_writeable.server.port
    }

    // Server routes are not configurable by users yet, use defaults
    // config.server.routes is already set from defaultConfig

    // Process warnings configuration
    if (configInput_as_writeable?.warnings?.interactiveWithoutSchema?.enabled !== undefined) {
      config.warnings.interactiveWithoutSchema.enabled =
        configInput_as_writeable.warnings.interactiveWithoutSchema.enabled
    }

    return config
  })
