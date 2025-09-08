import type { Augmentation } from '#api/schema/augmentations/augmentation'
import type { AugmentationConfig } from '#api/schema/augmentations/config'
import type { AugmentationInput } from '#api/schema/augmentations/input'
import { normalizeAugmentationInput } from '#api/schema/augmentations/input'
import type { GrafaidOld } from '#lib/grafaid-old'
import { GraphQLPath } from '#lib/graphql-path'
import { VersionCoverage } from '#lib/version-coverage'
import { Version } from '#lib/version/$'
import { HashMap, Match, Option } from 'effect'

/**
 * Apply version-aware augmentations to a schema.
 *
 * @param schema - The GraphQL schema to augment
 * @param augmentations - The input augmentations (may include version specifications)
 * @param version - The specific version to apply augmentations for (null for unversioned)
 */
export const applyAll = (
  schema: GrafaidOld.Schema.Schema,
  augmentations: readonly AugmentationInput[],
  version: Version.Version | null = null,
): GrafaidOld.Schema.Schema => {
  for (const augmentationInput of augmentations) {
    // Transform input to normalized format
    const normalized = normalizeAugmentationInput(augmentationInput)

    if (!normalized) {
      console.warn('Skipping invalid augmentation configuration')
      continue
    }

    applyVersioned(schema, normalized, version)
  }

  return schema
}

export const apply = (schema: GrafaidOld.Schema.Schema, augmentation: AugmentationConfig) => {
  Match.value(augmentation.on).pipe(
    Match.when(
      GraphQLPath.Definition.isTypeDefinitionPath,
      (path) => {
        const type = GraphQLPath.Schema.locateType(schema, path)
        mutateDescription(type, augmentation)
      },
    ),
    Match.when(
      GraphQLPath.Definition.isFieldDefinitionPath,
      (path) => {
        const field = GraphQLPath.Schema.locateField(schema, path)
        mutateDescription(field, augmentation)
      },
    ),
    Match.orElse(() => {
      throw new Error(`Unsupported path type for augmentations`)
    }),
  )
}

/**
 * Apply a version-aware augmentation to a schema.
 *
 * @param schema - The GraphQL schema to augment
 * @param augmentation - The normalized augmentation with version coverage
 * @param version - The specific version to apply augmentations for (null for unversioned)
 */
export const applyVersioned = (
  schema: GrafaidOld.Schema.Schema,
  augmentation: Augmentation,
  version: Version.Version | null,
) => {
  // Try to find augmentation for this specific version
  let config: AugmentationConfig | undefined

  if (version) {
    // First try exact version match
    const versionCoverage = VersionCoverage.single(version)
    const maybeConfig = HashMap.get(augmentation.versionAugmentations, versionCoverage)
    if (Option.isSome(maybeConfig)) {
      config = maybeConfig.value
    }

    // If not found, check if any coverage matches this version
    if (!config) {
      for (const [coverage, cfg] of augmentation.versionAugmentations) {
        if (VersionCoverage.matches(coverage, version)) {
          config = cfg
          break
        }
      }
    }
  } else {
    // For unversioned schemas, only apply unversioned augmentations
    const unversionedCoverage = VersionCoverage.unversioned()
    const maybeConfig = HashMap.get(augmentation.versionAugmentations, unversionedCoverage)
    if (Option.isSome(maybeConfig)) {
      config = maybeConfig.value
    }
  }

  // Apply the augmentation if found
  if (config) {
    Match.value(config.on).pipe(
      Match.when(
        GraphQLPath.Definition.isTypeDefinitionPath,
        (path) => {
          const type = GraphQLPath.Schema.locateType(schema, path)
          mutateDescription(type, config)
        },
      ),
      Match.when(
        GraphQLPath.Definition.isFieldDefinitionPath,
        (path) => {
          const field = GraphQLPath.Schema.locateField(schema, path)
          mutateDescription(field, config)
        },
      ),
      Match.orElse(() => {
        throw new Error(`Unsupported path type for augmentations`)
      }),
    )
  }
}

export const mutateDescription = (
  type: GrafaidOld.Groups.Describable,
  augmentation: AugmentationConfig,
) => {
  const existingDescription = type.description ?? ``

  type.description = Match.value(augmentation.placement).pipe(
    Match.when('before', () => `${augmentation.content}\n\n${existingDescription}`),
    Match.when('after', () => `${existingDescription}\n\n${augmentation.content}`),
    Match.when('over', () => augmentation.content),
    Match.exhaustive,
  )
}
