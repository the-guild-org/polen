import { AugmentationConfig } from '#api/schema/augmentations/config'
import { S } from '#dep/effect'
import { VersionCoverage } from 'graphql-kit'
import { GraphQLSchemaPath } from 'graphql-kit'
GraphQLSchemaPath

/**
 * Internal normalized schema for description augmentations.
 * Uses VersionCoverage as keys to support unversioned (all versions) and version-specific augmentations.
 */
export const Augmentation = S.Struct({
  // Map from VersionCoverage to augmentation config
  // Key can be:
  // - VersionCoverageUnversioned: applies to all versions
  // - VersionCoverageOne: applies to a specific version
  // - VersionCoverageSet: applies to a set of versions (future enhancement)
  versionAugmentations: S.HashMap({
    key: VersionCoverage.VersionCoverage,
    value: AugmentationConfig,
  }),
}).annotations({
  identifier: 'AugmentationNormalized',
  description: 'Internal normalized description augmentation with version coverage support',
})

export type Augmentation = typeof Augmentation.Type
