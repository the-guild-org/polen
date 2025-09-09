import { Augmentations } from '#api/schema/augmentations/$'
import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema - Input Source Names
// ============================================================================

export const InputSourceNameSchema = S.Enums(
  {
    file: 'file',
    directory: 'directory',
    versionedDirectory: 'versionedDirectory',
    memory: 'memory',
    introspection: 'introspection',
    introspectionFile: 'introspectionFile',
  } as const,
)

export type InputSourceName = S.Schema.Type<typeof InputSourceNameSchema>

// ============================================================================
// Schema - Input Sources
// ============================================================================

const FileOptionsSchema = S.Struct({
  /**
   * Path to the GraphQL SDL file.
   *
   * Can be absolute or relative to the project root.
   *
   * @default './schema.graphql'
   *
   * @example
   * ```ts
   * // Default location
   * path: './schema.graphql'
   *
   * // Custom location
   * path: './src/graphql/schema.sdl'
   * ```
   */
  path: S.optional(S.String),
}).annotations({
  identifier: 'FileOptions',
  description: 'Configuration for loading schema from a single SDL file.',
})

const DirectoryOptionsSchema = S.Struct({
  /**
   * Path to the directory containing schema files.
   *
   * Supports two patterns:
   * 1. Multiple versioned files with ISO date prefixes: `YYYY-MM-DD.graphql`
   * 2. Single file named: `schema.graphql`
   *
   * @default './schema'
   *
   * @example
   * ```ts
   * // Default location
   * path: './schema'
   *
   * // Custom location
   * path: './graphql/versions'
   * ```
   *
   * Directory structure examples:
   * ```
   * // Versioned schemas (enables changelog)
   * schema/
   *   2024-01-15.graphql
   *   2024-03-20.graphql
   *   2024-06-10.graphql
   *
   * // Single schema (non-versioned)
   * schema/
   *   schema.graphql
   * ```
   */
  path: S.optional(S.String),
}).annotations({
  identifier: 'DirectoryOptions',
  description: 'Configuration for loading multiple schema versions from a directory.',
})

const VersionedDirectoryOptionsSchema = S.Struct({
  /**
   * Path to the directory containing versioned schema subdirectories.
   *
   * @default './schema'
   */
  path: S.optional(S.String),
}).annotations({
  identifier: 'VersionedDirectoryOptions',
  description: 'Configuration for loading versioned schemas from subdirectories.',
})

const HttpHeadersSchema = S.Record({
  key: S.String,
  value: S.String,
})

const IntrospectionOptionsSchema = S.Struct({
  /**
   * The GraphQL endpoint URL to introspect.
   *
   * Must be a valid GraphQL endpoint that supports introspection queries.
   *
   * @example 'https://api.example.com/graphql'
   */
  url: S.String,
  /**
   * Optional headers to include in the introspection request.
   *
   * Use this for authentication, API keys, or any custom headers
   * required by your GraphQL endpoint.
   *
   * @example
   * ```ts
   * headers: {
   *   'Authorization': `Bearer ${process.env.API_TOKEN}`,
   *   'X-API-Key': process.env.API_KEY
   * }
   * ```
   */
  headers: S.optional(HttpHeadersSchema),
}).annotations({
  identifier: 'IntrospectionOptions',
  description: 'Configuration for loading schema via GraphQL introspection.',
})

const IntrospectionFileOptionsSchema = S.Struct({
  /**
   * Path to the introspection file.
   *
   * @default './schema.introspection.json'
   */
  path: S.optional(S.String),
}).annotations({
  identifier: 'IntrospectionFileOptions',
  description: 'Configuration for loading schema from an existing introspection file.',
})

// Complex union for memory revisions - we define the actual runtime types here
// and use S.Unknown for now, with a TODO to properly type this later
const MemoryRevisionsSchema = S.Unknown.annotations({
  description:
    `Schema revisions in various formats: SDL strings, GraphQL schema objects, or pre-built unversioned Catalog`,
})

const MemoryOptionsSchema = S.Struct({
  /**
   * Schema revisions defined in various formats.
   *
   * Creates an unversioned catalog with multiple revisions (dated snapshots) that can show changes over time.
   *
   * Can be:
   * - A single SDL string (single revision, no changelog)
   * - Array of SDL strings (uses current date for all)
   * - Array of objects with date and SDL (full changelog support)
   * - A GraphQLSchema object (single revision, no changelog)
   * - Array of GraphQLSchema objects (uses current date for all)
   * - Array of objects with date and GraphQLSchema (full changelog support)
   * - A pre-built unversioned Catalog object
   *
   * @example
   * ```ts
   * // Single SDL schema revision
   * revisions: `
   *   type Query {
   *     hello: String
   *   }
   * `
   *
   * // Multiple revisions with explicit dates (enables changelog)
   * revisions: [
   *   {
   *     date: new Date('2024-01-15'),
   *     value: `type Query { users: [User] }`
   *   },
   *   {
   *     date: new Date('2024-03-20'),
   *     value: `type Query { users: [User], posts: [Post] }`
   *   }
   * ]
   *
   * // GraphQL schema object
   * revisions: buildSchema(`type Query { hello: String }`)
   *
   * // Pre-built unversioned catalog
   * revisions: myCatalog
   * ```
   */
  revisions: MemoryRevisionsSchema,
}).annotations({
  identifier: 'MemoryOptions',
  description:
    'Configuration for defining schema revisions programmatically in memory. Creates an unversioned catalog.',
})

// ============================================================================
// Schema - Sources
// ============================================================================

const SourcesSchema = S.Struct({
  /**
   * Configuration for loading schema from a single SDL file.
   */
  file: S.optional(FileOptionsSchema),
  /**
   * Configuration for loading multiple schema versions from a directory.
   */
  directory: S.optional(DirectoryOptionsSchema),
  /**
   * Configuration for loading versioned schemas from subdirectories.
   */
  versionedDirectory: S.optional(VersionedDirectoryOptionsSchema),
  /**
   * Configuration for defining schemas programmatically.
   *
   * Accepts SDL strings, GraphQL schema objects, or pre-built SchemaHydrated objects.
   */
  memory: S.optional(MemoryOptionsSchema),
  /**
   * Configuration for loading schema via GraphQL introspection.
   *
   * Introspection fetches your schema directly from a running GraphQL endpoint
   * and caches it in `.polen/cache/introspection/`.
   *
   * @example
   * ```ts
   * introspection: {
   *   url: 'https://api.example.com/graphql',
   *   headers: { 'Authorization': 'Bearer token' }
   * }
   * ```
   */
  introspection: S.optional(IntrospectionOptionsSchema),
  /**
   * Configuration for loading schema from an existing introspection file.
   *
   * Reads a pre-existing `schema.introspection.json` file from your project root.
   * This is useful when you have an introspection file generated by other tools.
   *
   * @example
   * ```ts
   * introspectionFile: {
   *   // Uses default path: ./schema.introspection.json
   * }
   * ```
   */
  introspectionFile: S.optional(IntrospectionFileOptionsSchema),
}).annotations({
  identifier: 'Sources',
  description: 'Configuration for each data source type.',
})

// ============================================================================
// Schema - Main Config
// ============================================================================

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
 *   sources: {
 *     introspection: {
 *       url: 'https://api.example.com/graphql',
 *       headers: { 'Authorization': `Bearer ${process.env.API_TOKEN}` }
 *     }
 *   }
 * }
 *
 * // Multiple versions for changelog
 * schema: {
 *   sources: {
 *     directory: { path: './schema' }
 *   }
 * }
 *
 * // Custom source order
 * schema: {
 *   useSources: ['introspection', 'file'],
 *   sources: {
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
// ============================================================================
// Schema - Categories
// ============================================================================

const CategorySchema = S.Struct({
  /**
   * Display name for the category in the sidebar.
   *
   * @example
   * ```ts
   * name: 'Errors'
   * ```
   */
  name: S.String,
  /**
   * Patterns to match type names. Can be strings for exact matches or RegExp for pattern matching.
   *
   * @example
   * ```ts
   * // Match all types ending with "Error"
   * typeNames: [/.*Error$/]
   *
   * // Mix exact names and patterns
   * typeNames: ['CustomError', /.*Exception$/]
   * ```
   */
  typeNames: S.Array(S.Union(S.String, S.instanceOf(RegExp))),
  /**
   * Whether to include or exclude matched types.
   *
   * @default 'include'
   *
   * @example
   * ```ts
   * // Include all matched types (default)
   * mode: 'include'
   *
   * // Exclude all matched types
   * mode: 'exclude'
   * ```
   */
  mode: S.optional(S.Literal('include', 'exclude')),
}).annotations({
  identifier: 'Category',
  description: 'Configuration for grouping GraphQL types in the reference sidebar.',
})

const CategoriesSchema = S.Union(
  // Plain array - applies to all schema versions
  S.Array(CategorySchema),
  // Versioned object - different categories per version
  S.Record({ key: S.String, value: S.Array(CategorySchema) }),
).annotations({
  identifier: 'Categories',
  description: 'Categories configuration that can be versioned or unversioned.',
})

// ============================================================================
// Schema - Config
// ============================================================================

export const ConfigSchema = S.Struct({
  /**
   * Whether to enable schema loading.
   *
   * Set to `false` to disable schema features entirely. This removes
   * the Reference and Changelog pages from your portal.
   *
   * @default true
   *
   * @example
   * ```ts
   * // Disable schema features
   * schema: { enabled: false }
   * ```
   */
  enabled: S.optional(S.Boolean),
  /**
   * Programmatically enhance your GraphQL schema documentation without modifying the schema files.
   *
   * Perfect for adding implementation details, usage examples, deprecation notices,
   * or any additional context that helps developers understand your API better.
   *
   * @example
   * ```ts
   * augmentations: [
   *   {
   *     type: 'description',
   *     on: {
   *       type: 'TargetType',
   *       name: 'User'
   *     },
   *     placement: 'after',
   *     content: '\n\nSee the [User Guide](/guides/users) for detailed usage.'
   *   },
   *   {
   *     type: 'description',
   *     on: {
   *       type: 'TargetField',
   *       targetType: 'Query',
   *       name: 'users'
   *     },
   *     placement: 'after',
   *     content: '\n\n**Rate limit:** 100 requests per minute'
   *   }
   * ]
   * ```
   */
  augmentations: S.optional(S.Array(Augmentations.AugmentationInput)),
  /**
   * Custom categories for grouping GraphQL types in the reference sidebar.
   *
   * Categories help organize types logically (e.g., grouping all error types together).
   * Types matching the patterns will appear in dedicated sidebar sections.
   *
   * Can be:
   * - Plain array: Applies to all schema versions
   * - Versioned object: Different categories per schema version
   *
   * @example
   * ```ts
   * // Group all error types together (applies to all versions)
   * categories: [
   *   {
   *     name: 'Errors',
   *     typeNames: [/.*Error$/]
   *   }
   * ]
   *
   * // Version-specific categories
   * categories: {
   *   '2024-01-01': [
   *     { name: 'Errors', typeNames: [/.*Error$/] }
   *   ],
   *   '2024-06-01': [
   *     { name: 'Errors', typeNames: [/.*Error$/] },
   *     { name: 'Inputs', typeNames: [/.*Input$/] }
   *   ]
   * }
   * ```
   */
  categories: S.optional(CategoriesSchema),
  /**
   * Which data sources to use for loading schemas.
   *
   * - `file` - Load from a single SDL file (default: `./schema.graphql`)
   * - `directory` - Load multiple SDL files from a directory (default: `./schema/`)
   * - `versionedDirectory` - Load versioned schemas from subdirectories (default: `./schema/`)
   * - `memory` - Use schemas defined in configuration
   * - `introspection` - Load schema via GraphQL introspection
   * - `introspectionFile` - Load schema from an introspection JSON file
   *
   * If not specified, Polen tries all sources in this order:
   * 1. `versionedDirectory` 2. `directory` 3. `file` 4. `memory` 5. `introspection` 6. `introspectionFile`
   *
   * @example
   * ```ts
   * // Use only file source
   * useSources: 'file'
   *
   * // Try multiple sources in custom order
   * useSources: ['introspection', 'file']
   *
   * // Default behavior (try all sources)
   * // useSources: undefined
   * ```
   */
  useSources: S.optional(S.Union(InputSourceNameSchema, S.Array(InputSourceNameSchema))),
  /**
   * Configuration for each data source type.
   */
  sources: S.optional(SourcesSchema),
}).annotations({
  identifier: 'SchemaConfig',
  title: 'Schema Configuration',
  description: 'Configuration for how Polen loads your GraphQL schema.',
})

export type ConfigInput = S.Schema.Type<typeof ConfigSchema>

// For backward compatibility during migration
export type Config = ConfigInput

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(ConfigSchema)
export const encode = S.encode(ConfigSchema)
export const validate = S.validate(ConfigSchema)
