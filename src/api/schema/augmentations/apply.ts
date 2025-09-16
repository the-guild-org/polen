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
import { GraphQLSchemaPath } from '#lib/graphql-schema-path'
import { VersionCoverage } from '#lib/version-coverage'
import { Version } from '#lib/version/$'
import { Either, HashMap, Match, Option, pipe } from 'effect'
import type { GraphQLSchema } from 'graphql'

/**
 * Apply version-aware augmentations to a schema.
 *
 * @param schema - The GraphQL schema to augment (mutated in place)
 * @param augmentations - The input augmentations (may include version specifications)
 * @param version - The specific version to apply augmentations for (null for unversioned)
 * @returns Diagnostics generated during augmentation application
 */
// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a node is describable (has a description property).
 */
const isDescribable = (node: unknown): node is GrafaidOld.Groups.Describable => {
  return node !== null
    && typeof node === 'object'
    && 'description' in node
}

// ============================================================================
// Shared Logic
// ============================================================================

/**
 * Apply an augmentation to a path in the schema.
 * This is the shared logic between apply() and applyVersioned().
 *
 * @param schema - The GraphQL schema to augment
 * @param path - The path to resolve
 * @param augmentation - The augmentation config to apply
 * @param version - The version for diagnostic reporting (null for unversioned)
 * @returns Diagnostics if there were errors, empty array on success
 */
const applyAugmentationToPath = (
  schema: GraphQLSchema,
  path: GraphQLSchemaPath.Path,
  augmentation: AugmentationConfig,
  version: Version.Version | null = null,
): Diagnostic[] => {
  // Step 1: Traverse path to resolve node
  const resolve = GraphQLSchemaPath.Resolvers.GraphqlSchema.create({ schema })
  const result = resolve(path)

  if (Either.isLeft(result)) {
    const error = result.left as unknown
    // Use rich error rendering if it's a TraversalError
    let message: string
    let errorString: string

    if (GraphQLSchemaPath.Errors.TraversalError.is(error)) {
      message = GraphQLSchemaPath.Errors.TraversalError.print(error as any)
      errorString = (error as any).message || String(error)
    } else if (error instanceof Error) {
      message = error.message
      errorString = error.message
    } else {
      message = String(error)
      errorString = String(error)
    }

    return [makeDiagnosticInvalidPath({
      message,
      path: GraphQLSchemaPath.print(path),
      version,
      error: errorString,
    })]
  }

  // Step 2: Check if resolved node is describable
  const resolved = result.right
  if (!isDescribable(resolved)) {
    return [makeDiagnosticInvalidPath({
      message: `Path does not resolve to a describable node`,
      path: GraphQLSchemaPath.print(path),
      version,
      error: 'Node is not describable',
    })]
  }

  // Step 3: Apply augmentation
  mutateDescription(resolved, augmentation)
  return []
}

export const applyAll = (
  schema: GraphQLSchema,
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
  schema: GraphQLSchema,
  augmentation: AugmentationConfig,
): Diagnostic[] => {
  return applyAugmentationToPath(schema, augmentation.on, augmentation, null)
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
  schema: GraphQLSchema,
  augmentation: Augmentation,
  version: Version.Version | null,
): Diagnostic[] => {
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
    return applyAugmentationToPath(schema, config.on, config, version)
  } else if (version && HashMap.size(augmentation.versionAugmentations) > 0) {
    // No matching version coverage found - generate version mismatch diagnostic
    // Get first config from HashMap
    const firstEntry = pipe(
      augmentation.versionAugmentations,
      HashMap.values,
      (iter) => Array.from(iter)[0],
    )

    if (firstEntry) {
      return [makeDiagnosticVersionMismatch({
        message: `No augmentation found for version '${Version.encodeSync(version)}' on path '${
          GraphQLSchemaPath.print(firstEntry.on)
        }'`,
        path: GraphQLSchemaPath.print(firstEntry.on),
        requestedVersion: version,
        availableVersions: pipe(
          augmentation.versionAugmentations,
          HashMap.keys,
          (iter) => Array.from(iter).map(VersionCoverage.toLabel),
        ),
      })]
    }
  }

  return []
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
