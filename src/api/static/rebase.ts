import { Ef, Op, S } from '#dep/effect'
import { FileSystem } from '@effect/platform'
import { Fs, FsLoc } from '@wollybeard/kit'
import { Data } from 'effect'
import { buildManifest, type PolenBuildManifest } from './manifest.js'

// Custom error types
export class InvalidBasePathError extends Data.TaggedError('InvalidBasePathError')<{
  readonly path: string
  readonly reason: string
}> {}

export class ManifestNotFoundError extends Data.TaggedError('ManifestNotFoundError')<{
  readonly path: string
}> {}

export class TargetExistsError extends Data.TaggedError('TargetExistsError')<{
  readonly path: string
}> {}

export class HtmlProcessingError extends Data.TaggedError('HtmlProcessingError')<{
  readonly filePath: string
  readonly reason: string
}> {}

export type RebaseError = InvalidBasePathError | ManifestNotFoundError | TargetExistsError | HtmlProcessingError | Error

export type RebasePlan = RebaseOverwritePlan | RebaseCopyPlan

export interface RebaseOverwritePlan {
  changeMode: `mutate`
  newBasePath: string
  sourcePath: FsLoc.AbsDir
}

export interface RebaseCopyPlan {
  changeMode: `copy`
  newBasePath: string
  sourcePath: FsLoc.AbsDir
  targetPath: FsLoc.AbsDir
}

const validateBasePath = (path: string) =>
  Ef.succeed(path).pipe(
    Ef.filterOrFail(
      isValidUrlPath,
      (path) =>
        new InvalidBasePathError({
          path,
          reason: 'Path must start and end with /',
        }),
    ),
  )

/**
 * Rebase a Polen build to a new base path.
 *
 * @param plan - The rebase plan specifying source, target, and mode
 * @returns Effect that performs the rebase operation
 */
export const rebase = (
  plan: RebasePlan,
): Ef.Effect<void, RebaseError, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    // 1. Validate source is a Polen build
    const manifest = yield* buildManifest.read(plan.sourcePath).pipe(
      Ef.flatMap(Op.match({
        onNone: () =>
          Ef.fail(
            new ManifestNotFoundError({ path: FsLoc.encodeSync(plan.sourcePath) }),
          ),
        onSome: Ef.succeed,
      })),
    )

    // 2. Validate newBasePath is valid URL path
    yield* validateBasePath(plan.newBasePath)

    // 3. Handle copy vs mutate
    let workingPath: FsLoc.AbsDir
    if (plan.changeMode === `copy`) {
      const targetExists = yield* Fs.exists(plan.targetPath)
      if (targetExists) {
        const isEmpty = yield* isEmptyDirectory(plan.targetPath)
        if (!isEmpty) {
          return yield* Ef.fail(
            new TargetExistsError({ path: FsLoc.encodeSync(plan.targetPath) }),
          )
        }
      }
      yield* copyDirectory(plan.sourcePath, plan.targetPath)
      workingPath = plan.targetPath
    } else {
      workingPath = plan.sourcePath
    }

    // 4. Update HTML files with new base path
    yield* updateHtmlFiles(workingPath, manifest.basePath, plan.newBasePath)

    // 5. Update manifest
    yield* updateManifest(workingPath, { basePath: plan.newBasePath })
  })

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Local Helpers
//
//

const isEmptyDirectory = (path: FsLoc.AbsDir): Ef.Effect<boolean, Error, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const entries = yield* Fs.read(path).pipe(
      Ef.mapError((error) => new Error(`Failed to read directory: ${error}`)),
    )
    return entries.length === 0
  })

const copyDirectory = (
  from: FsLoc.AbsDir,
  to: FsLoc.AbsDir,
): Ef.Effect<void, Error, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // Ensure target directory exists by creating it
    const toPath = FsLoc.encodeSync(to)
    yield* fs.makeDirectory(toPath, { recursive: true }).pipe(
      Ef.catchAll(() => Ef.succeed(undefined)),
    )

    // Read source directory
    const entries = yield* Fs.read(from).pipe(
      Ef.mapError((error) => new Error(`Failed to read source directory: ${error}`)),
    )

    // Copy each entry in parallel
    yield* Ef.all(
      entries.map((entry: FsLoc.Groups.Abs.Abs) => {
        // Build target path by joining with the entry's name
        const entryName = FsLoc.name(entry)

        // Check if entry is a directory or file using the tag
        if (entry._tag === 'LocAbsDir') {
          // It's a directory - recurse
          const targetDir = FsLoc.join(to, S.decodeSync(FsLoc.RelDir.String)(entryName + '/'))
          return copyDirectory(entry as FsLoc.AbsDir, targetDir as FsLoc.AbsDir)
        } else {
          // It's a file - copy it
          const targetFile = FsLoc.join(to, S.decodeSync(FsLoc.RelFile.String)(entryName))
          return Fs.copy(
            entry as FsLoc.AbsFile,
            targetFile as FsLoc.AbsFile,
          )
        }
      }),
      { concurrency: 'unbounded' },
    )
  })

// TODO: this is very generic, factor out to kit-temp
const isValidUrlPath = (path: string): boolean => {
  // URL path should start with / and not contain invalid characters
  if (!path.startsWith(`/`)) return false
  if (!path.endsWith(`/`)) return false

  // Basic validation - no spaces, proper URL characters
  const urlPathRegex = /^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*\/$/
  return urlPathRegex.test(path)
}

const updateHtmlFiles = (
  buildPath: FsLoc.AbsDir,
  oldBasePath: string,
  newBasePath: string,
): Ef.Effect<void, Error, FileSystem.FileSystem> =>
  findHtmlFiles(buildPath).pipe(
    Ef.flatMap(htmlFiles =>
      Ef.all(
        htmlFiles.map(htmlFile => updateHtmlFile(htmlFile, oldBasePath, newBasePath)),
        { concurrency: 'unbounded' },
      )
    ),
    Ef.asVoid,
  )

const findHtmlFiles = (dir: FsLoc.AbsDir) =>
  Fs.glob(`**/*.html`, {
    absolute: true,
    cwd: dir,
    onlyFiles: true,
  })

const updateHtmlFile = (
  filePath: FsLoc.AbsFile,
  oldBasePath: string,
  newBasePath: string,
): Ef.Effect<void, Error, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const filePathStr = FsLoc.encodeSync(filePath)

    const content = yield* Fs.readString(filePath).pipe(
      Ef.mapError((error) => new Error(`Could not read HTML file ${filePathStr}: ${error}`)),
    )

    // Simple regex-based approach to update base tag
    // Look for existing base tag first
    const baseTagRegex = /<base\s+href\s*=\s*["']([^"']*)["'][^>]*>/i

    let updatedContent: string

    if (baseTagRegex.test(content)) {
      // Update existing base tag
      updatedContent = content.replace(baseTagRegex, `<base href="${newBasePath}">`)
    } else {
      // Insert new base tag in head
      const headRegex = /<head[^>]*>/i
      const headMatch = headRegex.exec(content)

      if (headMatch) {
        const insertPosition = headMatch.index + headMatch[0].length
        updatedContent = content.slice(0, insertPosition)
          + `\n  <base href="${newBasePath}">`
          + content.slice(insertPosition)
      } else {
        return yield* Ef.fail(
          new HtmlProcessingError({
            filePath: filePathStr,
            reason: 'Could not find <head> tag in HTML file',
          }),
        )
      }
    }

    yield* Fs.write(filePath, updatedContent).pipe(
      Ef.mapError((error) => new Error(`Failed to write HTML file ${filePathStr}: ${error}`)),
    )
  })

const updateManifest = (
  buildPath: FsLoc.AbsDir,
  updates: Partial<PolenBuildManifest>,
): Ef.Effect<void, ManifestNotFoundError | Error, FileSystem.FileSystem> =>
  buildManifest.read(buildPath).pipe(
    Ef.flatMap(Op.match({
      onNone: () =>
        Ef.fail(
          new ManifestNotFoundError({ path: FsLoc.encodeSync(buildPath) }),
        ),
      onSome: (currentManifest) => {
        const updatedManifest = { ...currentManifest, ...updates }
        return buildManifest.write(updatedManifest, buildPath).pipe(
          Ef.mapError((error) =>
            error instanceof Error ? error : new Error(`Failed to write manifest: ${String(error)}`)
          ),
        )
      },
    })),
  )
