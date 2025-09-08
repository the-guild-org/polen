import type { Augmentation } from '#api/schema/augmentations/augmentation'
import type { AugmentationConfig } from '#api/schema/augmentations/config'
import { Placement } from '#api/schema/augmentations/placement'
import { GraphQLPath } from '#lib/graphql-path'
import { S } from '#lib/kit-temp/effect'
import { VersionCoverage } from '#lib/version-coverage'
import { Version } from '#lib/version/$'
import { HashMap } from 'effect'

/**
 * User-facing input schema for description augmentations.
 * Supports both unversioned (applies to all) and version-specific configurations.
 *
 * The 'on' property accepts a string in one of two formats:
 * - Type target: 'TypeName' (e.g., 'Query', 'Pokemon')
 * - Field target: 'TypeName.fieldName' (e.g., 'Pokemon.id', 'Query.pokemons')
 */
export const AugmentationInput = S.Struct({
  // Top-level fields are optional (defaults for all versions)
  on: S.optional(S.String),
  placement: S.optional(Placement),
  content: S.optional(S.String),

  // Version-specific overrides
  versions: S.optional(
    S.Record({
      key: S.String, // version identifier like "v1", "v2"
      value: S.Struct({
        on: S.optional(S.String),
        placement: S.optional(Placement),
        content: S.optional(S.String),
      }),
    }),
  ),
}).annotations({
  identifier: 'AugmentationInput',
  description: 'User-facing description augmentation configuration with optional version support',
})

export type AugmentationInput = S.Schema.Type<typeof AugmentationInput>

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
      on: GraphQLPath.Definition.decode(input.on),
      placement: input.placement,
      content: input.content,
    }

    return {
      versionAugmentations: HashMap.set(
        map,
        VersionCoverage.unversioned(),
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
      on: GraphQLPath.Definition.decode(onString),
      placement,
      content,
    }
    const version = Version.decodeSync(versionStr)
    const coverage = VersionCoverage.single(version)

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
