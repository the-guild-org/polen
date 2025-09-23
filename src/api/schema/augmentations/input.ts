import type { Augmentation } from '#api/schema/augmentations/augmentation'
import type { AugmentationConfig } from '#api/schema/augmentations/config'
import { Placement } from '#api/schema/augmentations/placement'
import { S } from '#dep/effect'
import { HashMap } from 'effect'
import { GraphQLSchemaPath, Version, VersionCoverage } from 'graphql-kit'

/**
 * Configuration for augmenting GraphQL schema descriptions.
 *
 * This schema supports two usage patterns:
 *
 * 1. **Unversioned augmentations** - Apply to all schema versions
 * 2. **Version-specific augmentations** - Apply to specific schema versions with optional defaults
 *
 * @example
 * ```ts
 * // Unversioned - applies to all versions
 * {
 *   on: 'Pokemon',
 *   placement: 'after',
 *   content: '**Note:** This type includes battle stats.'
 * }
 *
 * // Version-specific with defaults
 * {
 *   on: 'Pokemon',                    // Default for all versions
 *   placement: 'after',                // Default for all versions
 *   content: 'Base Pokemon info.',    // Default content
 *   versions: {
 *     '2': {
 *       content: 'Enhanced Pokemon with battle capabilities.' // Override for v2
 *     },
 *     '3': {
 *       on: 'BattlePokemon',          // Different type in v3
 *       content: 'Battle-ready Pokemon with full stats.'
 *     }
 *   }
 * }
 * ```
 *
 * @remarks
 * When using version-specific augmentations:
 * - Top-level fields serve as defaults for all versions
 * - Version-specific fields override defaults
 * - A version entry must have complete configuration (after merging with defaults) to be valid
 * - Invalid paths or missing types will generate build diagnostics rather than crashing
 */
export const AugmentationInput = S.Struct({
  /**
   * GraphQL path to the type or field to augment.
   *
   * @example
   * - Type path: `'Pokemon'`, `'Query'`, `'User'`
   * - Field path: `'Pokemon.name'`, `'Query.users'`, `'Mutation.createUser'`
   *
   * @remarks
   * If the specified path doesn't exist in the schema, a diagnostic error will be generated
   * during the build process rather than causing a crash.
   */
  on: S.optional(S.String),

  /**
   * How to apply the augmentation content relative to existing description.
   *
   * - `'over'` - Replace the existing description entirely
   * - `'before'` - Prepend content to the existing description
   * - `'after'` - Append content to the existing description
   *
   * @default 'after'
   */
  placement: S.optional(Placement),

  /**
   * The content to add to the description.
   *
   * Supports full Markdown syntax including:
   * - Bold/italic text
   * - Code blocks and inline code
   * - Links
   * - Lists
   * - Tables
   *
   * @example
   * ```ts
   * content: `
   * **Important:** This field requires authentication.
   *
   * Example query:
   * \`\`\`graphql
   * query {
   *   users(limit: 10) {
   *     id
   *     name
   *   }
   * }
   * \`\`\`
   * `
   * ```
   */
  content: S.optional(S.String),

  /**
   * Version-specific augmentation overrides.
   *
   * Keys are version identifiers (e.g., `'1'`, `'2'`, `'3'`).
   * Values are partial augmentation configs that override top-level defaults.
   *
   * @example
   * ```ts
   * versions: {
   *   '1': { content: 'Legacy API - see migration guide.' },
   *   '2': { content: 'Current stable API.' },
   *   '3': {
   *     on: 'NewTypeName',  // Type renamed in v3
   *     content: 'Beta API - subject to change.'
   *   }
   * }
   * ```
   *
   * @remarks
   * - Version keys must be valid numeric strings
   * - Each version inherits top-level defaults
   * - Invalid version identifiers will generate build diagnostics
   * - Duplicate version keys will generate build diagnostics
   */
  versions: S.optional(
    S.Record({
      key: S.String,
      value: S.Struct({
        on: S.optional(S.String),
        placement: S.optional(Placement),
        content: S.optional(S.String),
      }),
    }),
  ),
}).annotations({
  identifier: 'AugmentationInput',
  description: 'Configuration for augmenting GraphQL schema descriptions with version support',
})

export type AugmentationInput = typeof AugmentationInput.Type

/**
 * Transform user-facing input to normalized internal representation.
 *
 * Rules:
 * 1. If no versions field → create single unversioned entry
 * 2. If versions field exists:
 *    - Create version-specific entries for each version
 *    - If top-level defaults exist, they are used as fallbacks for version entries
 *    - If a version entry would be incomplete without defaults, skip it
 */
export const normalizeAugmentationInput = (input: AugmentationInput): Augmentation | null => {
  const map = HashMap.empty<VersionCoverage.VersionCoverage, AugmentationConfig>()

  // Case 1: No versions field - create unversioned entry
  if (!input.versions || Object.keys(input.versions).length === 0) {
    // Must have complete top-level configuration
    if (!input.on || !input.placement || !input.content) {
      return null // Invalid: incomplete unversioned augmentation
    }

    const unversionedConfig: AugmentationConfig = {
      on: GraphQLSchemaPath.parse(input.on),
      placement: input.placement,
      content: input.content,
    }

    return {
      versionAugmentations: HashMap.set(
        map,
        VersionCoverage.Unversioned.make(),
        unversionedConfig,
      ),
    }
  }

  // Case 2: Has versions field - create version-specific entries
  let resultMap = map

  // Process each version
  for (const [versionStr, versionOverrides] of Object.entries(input.versions)) {
    // Merge with top-level defaults
    const onString = versionOverrides.on ?? input.on
    const placement = versionOverrides.placement ?? input.placement
    const content = versionOverrides.content ?? input.content

    // Skip if incomplete after merging with defaults
    if (!onString || !placement || !content) {
      continue
    }

    const config: AugmentationConfig = {
      on: GraphQLSchemaPath.parse(onString),
      placement,
      content,
    }
    const version = Version.decodeSync(versionStr)
    const coverage = VersionCoverage.One.make({ version })

    resultMap = HashMap.set(resultMap, coverage, config)
  }

  // If no valid version configurations were created, return null
  if (HashMap.size(resultMap) === 0) {
    return null
  }

  return {
    versionAugmentations: resultMap,
  }
}
