import { S } from '#dep/effect'
import { Ef } from '#dep/effect'
import { FileSystem } from '@effect/platform'
import { Fs, FsLoc } from '@wollybeard/kit'

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
  projectRoot: FsLoc.AbsDir,
  packageName: string,
): Ef.Effect<boolean, PackageInstallationError, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const packageJsonPath = FsLoc.join(projectRoot, FsLoc.fromString('package.json'))

    // Check if package.json exists
    const exists = yield* Fs.exists(packageJsonPath).pipe(
      Ef.mapError((error) =>
        new PackageJsonReadError({
          projectRoot: FsLoc.encodeSync(projectRoot),
          message: `Failed to check if package.json exists: ${(error as any).message || String(error)}`,
        })
      ),
    )

    if (!exists) {
      return yield* Ef.fail(
        new PackageJsonNotFound({
          projectRoot: FsLoc.encodeSync(projectRoot),
          message: `package.json not found in ${FsLoc.encodeSync(projectRoot)}`,
        }),
      )
    }

    // Read package.json content
    const content = yield* Fs.readString(packageJsonPath).pipe(
      Ef.mapError((error) =>
        new PackageJsonReadError({
          projectRoot: FsLoc.encodeSync(projectRoot),
          message: `Failed to read package.json: ${(error as any).message || String(error)}`,
        })
      ),
    )

    // Parse JSON
    const packageJson = yield* Ef.try({
      try: () => JSON.parse(content),
      catch: (error) =>
        new PackageJsonParseError({
          projectRoot: FsLoc.encodeSync(projectRoot),
          message: `Invalid JSON in package.json: ${error instanceof Error ? error.message : String(error)}`,
        }),
    })

    // Check if package is in dependencies or devDependencies
    return !!(packageJson.dependencies?.[packageName]
      ?? packageJson.devDependencies?.[packageName])
  }) as any
