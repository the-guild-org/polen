import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Home Page Components
// ============================================================================

const HeroCallToActionSchema = S.Struct({
  label: S.String,
  href: S.String,
  variant: S.optional(S.Literal('primary', 'secondary')),
}).annotations({
  identifier: 'HeroCallToAction',
  description: 'Call-to-action button configuration for the hero section.',
})

const HeroCallToActionsConfigSchema = S.Union(
  // Simple array - replaces defaults entirely
  S.Array(HeroCallToActionSchema),
  // Advanced object - compose with defaults
  S.Struct({
    before: S.optional(S.Array(HeroCallToActionSchema)),
    after: S.optional(S.Array(HeroCallToActionSchema)),
    over: S.optional(S.Array(HeroCallToActionSchema)),
  }),
).annotations({
  identifier: 'HeroCallToActionsConfig',
  description: 'CTA configuration - array replaces defaults, object composes with them.',
})

const HeroSection = S.Struct({
  /**
   * Title displayed in the hero section.
   *
   * Inheritance order:
   * 1. This property (if set)
   * 2. Top-level `name` property
   * 3. Package.json name (title-cased)
   * 4. 'My Developer Portal'
   *
   * @default Inherits from top-level `name` property
   * @example
   * ```ts
   * // Inherits from top-level name
   * defineConfig({
   *   name: 'Pokemon API',
   *   home: { hero: {} } // title will be 'Pokemon API'
   * })
   *
   * // Override with custom title
   * defineConfig({
   *   name: 'Pokemon API',
   *   home: { hero: { title: 'Pokemon GraphQL API' } }
   * })
   * ```
   */
  title: S.optional(S.String),
  /**
   * Tagline for your API hero section.
   *
   * Inheritance order:
   * 1. This property (if set)
   * 2. Top-level `description` property
   * 3. 'Explore and integrate with our GraphQL API'
   *
   * @default Inherits from top-level `description` property
   * @example
   * ```ts
   * // Inherits from top-level description
   * defineConfig({
   *   description: 'Catch Pokemon through GraphQL',
   *   home: { hero: {} } // tagline will be 'Catch Pokemon through GraphQL'
   * })
   *
   * // Override with custom tagline
   * defineConfig({
   *   description: 'Catch Pokemon through GraphQL',
   *   home: { hero: { tagline: 'The ultimate Pokemon API' } }
   * })
   * ```
   */
  tagline: S.optional(S.String),
  /**
   * Call-to-action buttons.
   *
   * Can be:
   * - Array: Replaces default CTAs entirely
   * - Object with before/after/over: Compose with defaults
   *   - before: Add CTAs before defaults
   *   - after: Add CTAs after defaults
   *   - over: Replace defaults entirely
   *
   * Default CTAs are added based on conventions:
   * - If examples/ directory exists: "View Examples" button
   * - If playground is enabled: "Explore Playground" button
   * - Always: "View Schema" button to /reference
   */
  callToActions: S.optional(HeroCallToActionsConfigSchema),
  /**
   * Path to hero image. Can be relative to public directory or absolute URL.
   * If not specified, Polen will auto-detect common hero image files in public/.
   */
  heroImage: S.optional(S.String),
}).annotations({
  identifier: 'HeroConfig',
  description: 'Configuration for the hero section of the home page.',
})

const SocialProofLogoSchema = S.Union(
  S.String,
  S.Struct({
    name: S.String,
    src: S.String,
    href: S.optional(S.String),
  }),
).annotations({
  identifier: 'SocialProofLogo',
  description: 'Logo configuration for social proof section.',
})

const SocialProofConfig = S.Struct({
  /**
   * Section title.
   * @default 'Trusted By'
   */
  title: S.optional(S.String),
  /**
   * Array of company logos to display.
   * Can be strings (auto-looks for /logos/{name}.svg) or objects with custom paths.
   */
  logos: S.Array(SocialProofLogoSchema),
}).annotations({
  identifier: 'SocialProofConfig',
  description: 'Configuration for social proof section showing customer/user logos.',
})

const SocialMediaPostSchema = S.Struct({
  platform: S.Literal('x', 'twitter', 'bluesky', 'mastodon'),
  id: S.String,
  embedCode: S.optional(S.String),
}).annotations({
  identifier: 'SocialMediaPost',
  description: 'Social media post configuration.',
})

const SocialMediaConfig = S.Struct({
  /**
   * Social media posts to embed or display.
   */
  posts: S.Array(SocialMediaPostSchema),
  /**
   * Display mode for social media content.
   * @default 'embed'
   */
  displayMode: S.optional(S.Literal('embed', 'screenshot')),
}).annotations({
  identifier: 'SocialMediaConfig',
  description: 'Configuration for social media highlights section.',
})

const QuickStartStepSchema = S.Struct({
  title: S.String,
  description: S.optional(S.String),
  code: S.String,
  language: S.optional(S.String),
}).annotations({
  identifier: 'QuickStartStep',
  description: 'Individual step in the quick start guide.',
})

// const QuickStartExampleSchema = S.Struct({
//   title: S.String,
//   description: S.optional(S.String),
//   query: S.String,
// }).annotations({
//   identifier: 'QuickStartExample',
//   description: 'Example query for the quick start section.',
// })

const PlaygroundConfigSchema = S.Struct({
  /**
   * GraphQL endpoint URL for the playground.
   */
  endpoint: S.optional(S.String),
  /**
   * Default headers for playground requests.
   */
  headers: S.optional(S.Record({ key: S.String, value: S.String })),
  /**
   * Default query to show in the playground.
   */
  defaultQuery: S.optional(S.String),
  /**
   * Enable mock data generation instead of real endpoint.
   * @default false
   */
  useMockData: S.optional(S.Boolean),
}).annotations({
  identifier: 'PlaygroundConfig',
  description: 'Configuration for the playground preview section.',
})

const QuickStartSection = S.Struct({
  /**
   * Which tabs to show in the quick start section.
   * @default ['setup', 'examples', 'playground']
   */
  tabs: S.optional(S.Array(S.Literal('setup', 'examples', 'playground'))),
  /**
   * Setup steps for getting started.
   */
  steps: S.optional(S.Array(QuickStartStepSchema)),
  /**
   * Programming languages to show examples for.
   * @default ['javascript', 'typescript', 'python', 'curl']
   */
  languages: S.optional(S.Array(S.String)),
  /**
   * Playground configuration for the quick start section.
   */
  playground: S.optional(PlaygroundConfigSchema),
}).annotations({
  identifier: 'QuickStartConfig',
  description: 'Configuration for the quick start section with code examples.',
})

const StatsSection = S.Struct({
  /**
   * Show schema statistics (types, queries, mutations count).
   * @default true
   */
  showSchemaStats: S.optional(S.Boolean),
  /**
   * External status endpoint to fetch API status from.
   */
  statusEndpoint: S.optional(S.String),
  /**
   * Custom metrics to display.
   */
  customMetrics: S.optional(
    S.Array(
      S.Struct({
        label: S.String,
        value: S.Union(S.String, S.Number),
        icon: S.optional(S.String),
      }),
    ),
  ),
}).annotations({
  identifier: 'StatsConfig',
  description: 'Configuration for statistics and metrics display.',
})

const ChangelogSection = S.Struct({
  /**
   * Maximum number of changelog entries to show.
   * @default 5
   */
  limit: S.optional(S.Number),
  /**
   * Show version selector if API is versioned.
   * @default true
   */
  showVersions: S.optional(S.Boolean),
}).annotations({
  identifier: 'ChangelogConfig',
  description: 'Configuration for the recent changes section.',
})

const ResourceLinkSchema = S.Struct({
  title: S.String,
  description: S.optional(S.String),
  href: S.String,
  icon: S.optional(S.String),
}).annotations({
  identifier: 'ResourceLink',
  description: 'Individual resource link.',
})

const ResourcesSection = S.Struct({
  /**
   * Quick links to important resources.
   */
  links: S.optional(S.Array(ResourceLinkSchema)),
  /**
   * Community links (GitHub, Discord, etc.).
   */
  communityLinks: S.optional(
    S.Array(
      S.Struct({
        platform: S.String,
        href: S.String,
      }),
    ),
  ),
  /**
   * Support contact information.
   */
  supportContact: S.optional(
    S.Struct({
      email: S.optional(S.String),
      href: S.optional(S.String),
      text: S.optional(S.String),
    }),
  ),
}).annotations({
  identifier: 'ResourcesConfig',
  description: 'Configuration for the resources section.',
})

const ExamplesSection = S.Struct({
  /**
   * Maximum number of examples to show on the home page.
   * Additional examples can be viewed on a dedicated examples page.
   *
   * @default 3
   */
  maxExamples: S.optional(S.Number),
  /**
   * Show execution times for examples when available.
   *
   * @default false
   */
  showExecutionTime: S.optional(S.Boolean),
  /**
   * Title for the examples section.
   *
   * @default 'API Examples'
   */
  title: S.optional(S.String),
  /**
   * Description for the examples section.
   *
   * @default 'Explore common queries and mutations for our GraphQL API'
   */
  description: S.optional(S.String),
}).annotations({
  identifier: 'ExamplesSectionConfig',
  description: 'Configuration for the examples section on the home page.',
})

// ============================================================================
// Main Home Config
// ============================================================================

/**
 * Configuration for the home page of your Polen developer portal.
 *
 * All sections are optional and can be configured independently.
 * Missing sections will use sensible defaults or be omitted entirely.
 *
 * @example
 * ```ts
 * home: {
 *   hero: {
 *     title: 'Pokemon GraphQL API',
 *     description: 'Query Pokemon data with GraphQL'
 *   },
 *   socialProof: {
 *     logos: ['company-a', 'company-b']
 *   },
 *   quickStart: {
 *     languages: ['javascript', 'python', 'go']
 *   }
 * }
 * ```
 */
export const HomeConfig = S.Struct({
  /**
   * Enable or disable the home page entirely.
   * @default true
   */
  enabled: S.optional(S.Boolean),
  /**
   * Hero section configuration.
   */
  hero: S.optional(S.Union(S.Boolean, HeroSection)),
  /**
   * Social proof section with customer/user logos.
   */
  socialProof: S.optional(S.Union(S.Boolean, SocialProofConfig)),
  /**
   * Social media highlights section.
   */
  socialMedia: S.optional(S.Union(S.Boolean, SocialMediaConfig)),
  /**
   * Examples section configuration.
   */
  examples: S.optional(S.Union(S.Boolean, ExamplesSection)),
  /**
   * Quick start section with code examples and playground.
   */
  quickStart: S.optional(S.Union(S.Boolean, QuickStartSection)),
  /**
   * Statistics and metrics section.
   */
  stats: S.optional(S.Union(S.Boolean, StatsSection)),
  /**
   * Recent changelog entries section.
   */
  changelog: S.optional(S.Union(S.Boolean, ChangelogSection)),
  /**
   * Resources and links section.
   */
  resources: S.optional(S.Union(S.Boolean, ResourcesSection)),
}).annotations({
  identifier: 'HomeConfig',
  title: 'Home Page Configuration',
  description: 'Configuration for your Polen developer portal home page.',
})

export type HomeConfig = S.Schema.Type<typeof HomeConfig>
