import { ExamplesConfig } from '#api/examples/config'
import { ConfigSchema as ConfigSchemaOriginal } from '#api/schema/config-schema'
import { Typings } from '#api/typings/$'
import { assertPathAbsolute } from '#lib/kit-temp'
import { S } from '#lib/kit-temp/effect'
import { packagePaths } from '#package-paths'
import { Manifest, Path, Str } from '@wollybeard/kit'
import { Effect } from 'effect'
import type { WritableDeep } from 'type-fest'
import { BuildArchitecture, ConfigInput } from './input.js'

// ============================================================================
// Normalized Home Config
// ============================================================================

/**
 * Normalized home configuration where all `true` values are expanded to their object forms.
 * This is the shape after normalization, not the input shape.
 */
const HomeConfig = S.Struct({
  /**
   * Whether the home page is enabled.
   */
  enabled: S.Boolean,

  /**
   * Hero section - false to disable, object with configuration.
   * After normalization, `true` is expanded to object with defaults.
   */
  hero: S.Union(
    S.Literal(false),
    S.Struct({
      title: S.optional(S.String),
      tagline: S.optional(S.String),
      callToActions: S.optional(S.Unknown), // Complex type, using Unknown for now
      heroImage: S.optional(S.String),
    }),
  ),

  /**
   * Social proof section - false to disable, object with configuration.
   */
  socialProof: S.Union(
    S.Literal(false),
    S.Struct({
      title: S.optional(S.String),
      logos: S.Array(S.Unknown), // Complex type
    }),
  ),

  /**
   * Social media section - false to disable, object with configuration.
   */
  socialMedia: S.Union(
    S.Literal(false),
    S.Struct({
      posts: S.Array(S.Unknown), // Complex type
      displayMode: S.optional(S.Literal('embed', 'screenshot')),
    }),
  ),

  /**
   * Examples section - false to disable, object with configuration.
   * After normalization, `true` is expanded to object with defaults.
   */
  examples: S.Union(
    S.Literal(false),
    S.Struct({
      title: S.optional(S.String),
      description: S.optional(S.String),
      maxExamples: S.Number,
      showExecutionTime: S.Boolean,
    }),
  ),

  /**
   * Quick start section - false to disable, object with configuration.
   */
  quickStart: S.Union(
    S.Literal(false),
    S.Struct({
      tabs: S.optional(S.Array(S.Literal('setup', 'examples', 'playground'))),
      steps: S.optional(S.Array(S.Unknown)), // Complex type
      languages: S.optional(S.Array(S.String)),
      playground: S.optional(S.Unknown), // Complex type
    }),
  ),

  /**
   * Stats section - false to disable, object with configuration.
   */
  stats: S.Union(
    S.Literal(false),
    S.Struct({
      showSchemaStats: S.optional(S.Boolean),
      statusEndpoint: S.optional(S.String),
      customMetrics: S.optional(S.Array(S.Unknown)), // Complex type
    }),
  ),

  /**
   * Changelog section - false to disable, object with configuration.
   */
  changelog: S.Union(
    S.Literal(false),
    S.Struct({
      limit: S.optional(S.Number),
      showVersions: S.optional(S.Boolean),
    }),
  ),

  /**
   * Resources section - false to disable, object with configuration.
   */
  resources: S.Union(
    S.Literal(false),
    S.Struct({
      links: S.optional(S.Array(S.Unknown)), // Complex type
      communityLinks: S.optional(S.Array(S.Unknown)), // Complex type
      supportContact: S.optional(S.Unknown), // Complex type
    }),
  ),
}).annotations({
  identifier: 'HomeConfigNormalized',
  description: 'Normalized home configuration with all boolean shortcuts expanded to their object forms.',
})

export type HomeConfig = S.Schema.Type<typeof HomeConfig>

// ============================================================================
// Template Variables
// ============================================================================

const TemplateVariables = S.Struct({
  title: S.String,
}).annotations({
  identifier: 'TemplateVariablesNormalized',
  description: 'Normalized template variables with resolved defaults.',
})

export type TemplateVariables = S.Schema.Type<typeof TemplateVariables>

// ============================================================================
// Package Paths
// ============================================================================

const PackagePaths = S.Struct({
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
// Paths
// ============================================================================

const ProjectPaths = S.Struct({
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

const FrameworkPaths = S.extend(
  PackagePaths,
  S.Struct({
    devAssets: S.Struct({
      relative: S.String,
      absolute: S.String,
      schemas: S.String,
    }),
    generatedTypes: S.Struct({
      relative: S.String,
      absolute: S.String,
    }),
  }),
).annotations({
  identifier: 'FrameworkPaths',
  description: 'Framework paths including dev assets and generated types.',
})

const Paths = S.Struct({
  project: ProjectPaths,
  framework: FrameworkPaths,
}).annotations({
  identifier: 'Paths',
  description: 'Complete paths configuration for project and framework.',
})

// ============================================================================
// Config
// ============================================================================

/**
 * Normalized Polen configuration with all defaults resolved.
 *
 * This represents the fully processed configuration after:
 * - Applying defaults for all optional fields
 * - Computing derived paths
 * - Resolving package.json fallbacks
 */
export const Config = S.Struct({
  /**
   * The original user input configuration.
   */
  _input: S.suspend(() => ConfigInput),

  /**
   * Name of the API/project.
   * Falls back to package.json name or 'My Developer Portal'.
   */
  name: S.String,

  /**
   * Description of the API/project.
   * Falls back to a generic description.
   */
  description: S.String,

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
  templateVariables: TemplateVariables,

  /**
   * Schema configuration or null if disabled.
   */
  schema: S.Union(S.Null, ConfigSchemaOriginal),

  /**
   * Examples configuration with resolved defaults.
   */
  examples: ExamplesConfig,

  /**
   * Home page configuration with resolved defaults.
   */
  home: HomeConfig,

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
  paths: Paths,

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
export type Config = S.Schema.Type<typeof Config>

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decode(Config)
export const encode = S.encode(Config)
export const validate = S.validate(Config)

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
      generatedTypes: {
        relative: Typings.relativePathGeneratedTypesDir,
        absolute: rootAbsolute(Typings.relativePathGeneratedTypesDir),
      },
    },
  }
}

const getConfigInputDefaults = (): Config => ({
  _input: {},
  name: `My Developer Portal`,
  description: `Explore and integrate with our GraphQL API`,
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
  examples: {
    display: 'all',
  },
  home: {
    enabled: true,
    hero: {
      title: undefined,
      tagline: undefined,
      callToActions: undefined,
      heroImage: undefined,
    },
    socialProof: false,
    socialMedia: false,
    examples: {
      title: undefined,
      description: undefined,
      maxExamples: 3,
      showExecutionTime: false,
    },
    quickStart: false,
    stats: false,
    changelog: false,
    resources: false,
  },
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

    // Handle the top-level name property
    if (configInput_as_writeable?.name !== undefined) {
      config.name = configInput_as_writeable.name
      // Also use it as the default for templateVariables.title if not set
      if (!configInput_as_writeable?.templateVariables?.title) {
        config.templateVariables.title = configInput_as_writeable.name
      }
    }

    // Handle the top-level description property
    if (configInput_as_writeable?.description !== undefined) {
      config.description = configInput_as_writeable.description
    }

    // Try to read package.json name as fallback for title and name
    if (!configInput_as_writeable?.templateVariables?.title || !configInput_as_writeable?.name) {
      const packageJsonResult = yield* Effect.tryPromise({
        try: () => Manifest.resource.read(config.paths.project.rootDir),
        catch: (error) => new Error(`Failed to read package.json: ${error}`),
      }).pipe(
        Effect.either, // Convert failure to Either.Left, success to Either.Right
      )

      // If we successfully read package.json and it has a name, use it
      if (packageJsonResult._tag === 'Right' && packageJsonResult.right.name) {
        const titleCasedName = Str.Case.title(packageJsonResult.right.name)

        // Use for title if not already set
        if (!configInput_as_writeable?.templateVariables?.title) {
          config.templateVariables.title = titleCasedName
        }

        // Use for name if not already set
        if (!configInput_as_writeable?.name) {
          config.name = titleCasedName
        }
      }
      // Otherwise, the defaults from getConfigInputDefaults() will be used
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

    // Process examples configuration
    if (configInput_as_writeable?.examples) {
      const examplesInput = configInput_as_writeable.examples

      if (examplesInput.display !== undefined) {
        config.examples.display = examplesInput.display
      }

      if (examplesInput.diagnostics !== undefined) {
        config.examples.diagnostics = examplesInput.diagnostics
      }
    }

    // Process home configuration
    if (configInput_as_writeable?.home) {
      const homeInput = configInput_as_writeable.home

      // Handle enabled state
      if (homeInput.enabled !== undefined) {
        config.home.enabled = homeInput.enabled
      }

      // Process each section - false means disabled, true means use defaults, object means custom config

      // Hero section
      if (homeInput.hero !== undefined) {
        if (homeInput.hero === false) {
          config.home.hero = false
        } else if (homeInput.hero === true) {
          config.home.hero = {
            // Use name and description from top-level config as defaults
            title: config.name,
            tagline: config.description,
            callToActions: undefined,
            heroImage: undefined,
          }
        } else {
          // It's an object with custom configuration
          config.home.hero = {
            title: homeInput.hero.title ?? config.name,
            tagline: homeInput.hero.tagline ?? config.description,
            callToActions: homeInput.hero.callToActions,
            heroImage: homeInput.hero.heroImage,
          }
        }
      } else {
        // Default: hero is enabled with smart defaults
        config.home.hero = {
          title: config.name,
          tagline: config.description,
          callToActions: undefined,
          heroImage: undefined,
        }
      }

      // Social proof section
      if (homeInput.socialProof !== undefined) {
        if (homeInput.socialProof === false) {
          config.home.socialProof = false
        } else if (homeInput.socialProof === true) {
          // When true, we need actual logos data - can't use defaults
          // So we treat true as false (disabled) since we don't have logos
          config.home.socialProof = false
        } else {
          config.home.socialProof = homeInput.socialProof
        }
      }

      // Social media section
      if (homeInput.socialMedia !== undefined) {
        if (homeInput.socialMedia === false) {
          config.home.socialMedia = false
        } else if (homeInput.socialMedia === true) {
          // When true, we need actual posts data - can't use defaults
          // So we treat true as false (disabled) since we don't have posts
          config.home.socialMedia = false
        } else {
          config.home.socialMedia = homeInput.socialMedia
        }
      }

      // Examples section
      if (homeInput.examples !== undefined) {
        if (homeInput.examples === false) {
          config.home.examples = false
        } else if (homeInput.examples === true) {
          config.home.examples = {
            title: undefined,
            description: undefined,
            maxExamples: 3,
            showExecutionTime: false,
          }
        } else {
          config.home.examples = {
            title: homeInput.examples.title,
            description: homeInput.examples.description,
            maxExamples: homeInput.examples.maxExamples ?? 3,
            showExecutionTime: homeInput.examples.showExecutionTime ?? false,
          }
        }
      }

      // Quick start section
      if (homeInput.quickStart !== undefined) {
        if (homeInput.quickStart === false) {
          config.home.quickStart = false
        } else if (homeInput.quickStart === true) {
          config.home.quickStart = {
            tabs: ['setup', 'examples', 'playground'],
            steps: undefined,
            languages: ['javascript', 'typescript', 'python', 'curl'],
            playground: undefined,
          }
        } else {
          config.home.quickStart = homeInput.quickStart
        }
      }

      // Stats section
      if (homeInput.stats !== undefined) {
        if (homeInput.stats === false) {
          config.home.stats = false
        } else if (homeInput.stats === true) {
          config.home.stats = {
            showSchemaStats: true,
            statusEndpoint: undefined,
            customMetrics: undefined,
          }
        } else {
          config.home.stats = homeInput.stats
        }
      }

      // Changelog section
      if (homeInput.changelog !== undefined) {
        if (homeInput.changelog === false) {
          config.home.changelog = false
        } else if (homeInput.changelog === true) {
          config.home.changelog = {
            limit: 5,
            showVersions: true,
          }
        } else {
          config.home.changelog = homeInput.changelog
        }
      }

      // Resources section
      if (homeInput.resources !== undefined) {
        if (homeInput.resources === false) {
          config.home.resources = false
        } else if (homeInput.resources === true) {
          config.home.resources = {
            links: undefined,
            communityLinks: undefined,
            supportContact: undefined,
          }
        } else {
          config.home.resources = homeInput.resources
        }
      }
    } else {
      // No home config provided, apply smart defaults for hero
      config.home.hero = {
        title: config.name,
        tagline: config.description,
        callToActions: undefined,
        heroImage: undefined,
      }
    }

    return config
  })
