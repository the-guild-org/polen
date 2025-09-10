import type { Augmentation } from '#api/schema/augmentations/augmentation'
import type { AugmentationConfig } from '#api/schema/augmentations/config'
import {
  Diagnostic,
  makeDiagnosticDuplicateVersion,
  makeDiagnosticInvalidPath,
  makeDiagnosticVersionMismatch,
} from '#api/schema/augmentations/diagnostics/diagnostic'
import type { AugmentationInput } from '#api/schema/augmentations/input'
import { normalizeAugmentationInput } from '#api/schema/augmentations/input'
import type { GrafaidOld } from '#lib/grafaid-old'
import { GraphQLPath } from '#lib/graphql-path'
import { VersionCoverage } from '#lib/version-coverage'
import { Version } from '#lib/version/$'
import { Either, HashMap, Match, Option, pipe } from 'effect'

/**
 * Apply version-aware augmentations to a schema.
 *
 * @param schema - The GraphQL schema to augment (mutated in place)
 * @param augmentations - The input augmentations (may include version specifications)
 * @param version - The specific version to apply augmentations for (null for unversioned)
 * @returns Diagnostics generated during augmentation application
 */
export const applyAll = (
  schema: GrafaidOld.Schema.Schema,
  augmentations: readonly AugmentationInput[],
  version: Version.Version | null = null,
): { diagnostics: Diagnostic[] } => {
  const diagnostics: Diagnostic[] = []

  // Track versions to detect duplicates
  const seenVersions = new Map<string, AugmentationInput>()

  for (const augmentationInput of augmentations) {
    // Check for duplicate versions
    const versionKey = augmentationInput.versions
      ? Object.keys(augmentationInput.versions).sort().join(',')
      : 'unversioned'

    if (seenVersions.has(versionKey) && versionKey !== 'unversioned') {
      const firstInput = seenVersions.get(versionKey)!
      diagnostics.push(makeDiagnosticDuplicateVersion({
        message: `Duplicate version '${versionKey}' found in augmentation configuration`,
        version: versionKey,
        firstPath: firstInput.on ?? 'unknown',
        duplicatePath: augmentationInput.on ?? 'unknown',
      }))
      continue
    }
    seenVersions.set(versionKey, augmentationInput)

    // Transform input to normalized format
    const normalized = normalizeAugmentationInput(augmentationInput)

    if (!normalized) {
      console.warn('Skipping invalid augmentation configuration')
      continue
    }

    const applyDiagnostics = applyVersioned(schema, normalized, version)
    diagnostics.push(...applyDiagnostics)
  }

  return { diagnostics }
}

export const apply = (
  schema: GrafaidOld.Schema.Schema,
  augmentation: AugmentationConfig,
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []

  pipe(
    augmentation.on,
    Match.value,
    Match.when(
      GraphQLPath.Definition.isTypeDefinitionPath,
      (path) => {
        pipe(
          GraphQLPath.Schema.locateType(schema, path),
          Either.match({
            onLeft: (error) => {
              diagnostics.push(makeDiagnosticInvalidPath({
                message: `Type '${error.typeName}' not found in schema`,
                path: error.path,
                version: null,
                error: `Type '${error.typeName}' not found`,
              }))
            },
            onRight: (type) => {
              mutateDescription(type, augmentation)
            },
          }),
        )
      },
    ),
    Match.when(
      GraphQLPath.Definition.isFieldDefinitionPath,
      (path) => {
        pipe(
          GraphQLPath.Schema.locateField(schema, path),
          Either.match({
            onLeft: (error) => {
              diagnostics.push(makeDiagnosticInvalidPath({
                message: `Field '${error.fieldName}' not found on type '${error.typeName}'`,
                path: error.path,
                version: null,
                error: `Field '${error.fieldName}' not found on type '${error.typeName}'`,
              }))
            },
            onRight: (field) => {
              mutateDescription(field, augmentation)
            },
          }),
        )
      },
    ),
    Match.orElse(() => {
      diagnostics.push(makeDiagnosticInvalidPath({
        message: `Unsupported path type for augmentations: ${GraphQLPath.Definition.encodeSync(augmentation.on)}`,
        path: GraphQLPath.Definition.encodeSync(augmentation.on),
        version: null,
        error: 'Unsupported path type for augmentations',
      }))
    }),
  )

  return diagnostics
}

/**
 * Apply a version-aware augmentation to a schema.
 *
 * @param schema - The GraphQL schema to augment
 * @param augmentation - The normalized augmentation with version coverage
 * @param version - The specific version to apply augmentations for (null for unversioned)
 * @returns Diagnostics generated during augmentation application
 */
export const applyVersioned = (
  schema: GrafaidOld.Schema.Schema,
  augmentation: Augmentation,
  version: Version.Version | null,
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []
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
    pipe(
      config.on,
      Match.value,
      Match.when(
        GraphQLPath.Definition.isTypeDefinitionPath,
        (path) => {
          pipe(
            GraphQLPath.Schema.locateType(schema, path),
            Either.match({
              onLeft: (error) => {
                diagnostics.push(makeDiagnosticInvalidPath({
                message: `Type '${error.typeName}' not found in schema`,
                path: error.path,
                version: version,
                  error: `Type '${error.typeName}' not found`,
                }))
              },
              onRight: (type) => {
                mutateDescription(type, config)
              },
            }),
          )
        },
      ),
      Match.when(
        GraphQLPath.Definition.isFieldDefinitionPath,
        (path) => {
          pipe(
            GraphQLPath.Schema.locateField(schema, path),
            Either.match({
              onLeft: (error) => {
                diagnostics.push(makeDiagnosticInvalidPath({
                message: `Field '${error.fieldName}' not found on type '${error.typeName}'`,
                path: error.path,
                version: version,
                  error: `Field '${error.fieldName}' not found on type '${error.typeName}'`,
                }))
              },
              onRight: (field) => {
                mutateDescription(field, config)
              },
            }),
          )
        },
      ),
      Match.orElse(() => {
        diagnostics.push(makeDiagnosticInvalidPath({
          message: `Unsupported path type for augmentations: ${GraphQLPath.Definition.encodeSync(config.on)}`,
          path: GraphQLPath.Definition.encodeSync(config.on),
          version: version,
          error: 'Unsupported path type for augmentations',
        }))
      }),
    )
  } else if (version && HashMap.size(augmentation.versionAugmentations) > 0) {
    // No matching version coverage found - generate version mismatch diagnostic
    // Get first config from HashMap
    const firstEntry = pipe(
      augmentation.versionAugmentations,
      HashMap.values,
      (iter) => Array.from(iter)[0],
    )

    if (firstEntry) {
      diagnostics.push(makeDiagnosticVersionMismatch({
        message: `No augmentation found for version '${Version.encodeSync(version)}' on path '${
          GraphQLPath.Definition.encodeSync(firstEntry.on)
        }'`,
        path: GraphQLPath.Definition.encodeSync(firstEntry.on),
        requestedVersion: version,
        availableVersions: pipe(
          augmentation.versionAugmentations,
          HashMap.keys,
          (iter) => Array.from(iter).map(VersionCoverage.toLabel),
        ),
      }))
    }
  }

  return diagnostics
}

export const mutateDescription = (
  type: GrafaidOld.Groups.Describable,
  augmentation: AugmentationConfig,
) => {
  const existingDescription = type.description?.trim() ?? ''

  type.description = Match.value(augmentation.placement).pipe(
    Match.when(
      'before',
      () => existingDescription ? `${augmentation.content}\n\n${existingDescription}` : augmentation.content,
    ),
    Match.when(
      'after',
      () => existingDescription ? `${existingDescription}\n\n${augmentation.content}` : augmentation.content,
    ),
    Match.when('over', () => augmentation.content),
    Match.exhaustive,
  )
}
