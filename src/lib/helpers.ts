import { S } from '#lib/kit-temp/effect'
import { FileSystem } from '@effect/platform'
import { Effect } from 'effect'
import * as Path from 'node:path'

// ============================================================================
// Error Types
// ============================================================================

export class PackageJsonNotFound extends S.TaggedError<PackageJsonNotFound>()('PackageJsonNotFound', {
  projectRoot: S.String,
  message: S.String,
}) {}

export class PackageJsonReadError extends S.TaggedError<PackageJsonReadError>()('PackageJsonReadError', {
  projectRoot: S.String,
  message: S.String,
}) {}

export class PackageJsonParseError extends S.TaggedError<PackageJsonParseError>()('PackageJsonParseError', {
  projectRoot: S.String,
  message: S.String,
}) {}

export type PackageInstallationError = PackageJsonNotFound | PackageJsonReadError | PackageJsonParseError

// ============================================================================
// Core Function
// ============================================================================

/**
 * Check if a project has a package installed by examining its package.json
 */
export const checkIsProjectHasPackageInstalled = (
  projectRoot: string,
  packageName: string,
): Effect.Effect<boolean, PackageInstallationError, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const packageJsonPath = Path.join(projectRoot, 'package.json')

    // Check if package.json exists
    const exists = yield* fs.exists(packageJsonPath).pipe(
      Effect.mapError((error) =>
        new PackageJsonReadError({
          projectRoot,
          message: `Failed to check if package.json exists: ${(error as any).message || String(error)}`,
        })
      ),
    )

    if (!exists) {
      return yield* Effect.fail(
        new PackageJsonNotFound({
          projectRoot,
          message: `package.json not found in ${projectRoot}`,
        }),
      )
    }

    // Read package.json content
    const content = yield* fs.readFileString(packageJsonPath).pipe(
      Effect.mapError((error) =>
        new PackageJsonReadError({
          projectRoot,
          message: `Failed to read package.json: ${(error as any).message || String(error)}`,
        })
      ),
    )

    // Parse JSON
    const packageJson = yield* Effect.try({
      try: () => JSON.parse(content),
      catch: (error) =>
        new PackageJsonParseError({
          projectRoot,
          message: `Invalid JSON in package.json: ${error instanceof Error ? error.message : String(error)}`,
        }),
    })

    // Check if package is in dependencies or devDependencies
    return !!(packageJson.dependencies?.[packageName]
      ?? packageJson.devDependencies?.[packageName])
  })
