import { O } from '#dep/effect'
import { TinyGlobby } from '#dep/tiny-globby/index'
import { FileSystem } from '@effect/platform'
import { NodeFileSystem } from '@effect/platform-node'
import { Path } from '@wollybeard/kit'
import { Data, Effect } from 'effect'
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
  sourcePath: string
}

export interface RebaseCopyPlan {
  changeMode: `copy`
  newBasePath: string
  sourcePath: string
  targetPath: string
}

const validateBasePath = (path: string) =>
  Effect.succeed(path).pipe(
    Effect.filterOrFail(
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
): Effect.Effect<void, RebaseError, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // 1. Validate source is a Polen build
    const manifest = yield* buildManifest.read(plan.sourcePath).pipe(
      Effect.flatMap(O.match({
        onNone: () =>
          Effect.fail(
            new ManifestNotFoundError({ path: plan.sourcePath }),
          ),
        onSome: Effect.succeed,
      })),
    )

    // 2. Validate newBasePath is valid URL path
    yield* validateBasePath(plan.newBasePath)

    // 3. Handle copy vs mutate
    let workingPath: string
    if (plan.changeMode === `copy`) {
      const targetExists = yield* fs.exists(plan.targetPath)
      if (targetExists) {
        const isEmpty = yield* isEmptyDirectory(plan.targetPath)
        if (!isEmpty) {
          return yield* Effect.fail(
            new TargetExistsError({ path: plan.targetPath }),
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

const isEmptyDirectory = (path: string): Effect.Effect<boolean, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const entries = yield* fs.readDirectory(path).pipe(
      Effect.mapError((error) => new Error(`Failed to read directory: ${error}`)),
    )
    return entries.length === 0
  })

const copyDirectory = (from: string, to: string): Effect.Effect<void, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // Ensure target directory exists
    yield* fs.makeDirectory(to, { recursive: true }).pipe(
      Effect.mapError((error) => new Error(`Failed to create target directory: ${error}`)),
    )

    // Read source directory
    const entries = yield* fs.readDirectory(from).pipe(
      Effect.mapError((error) => new Error(`Failed to read source directory: ${error}`)),
    )

    // Copy each entry in parallel
    yield* Effect.all(
      entries.map(entry => {
        const sourcePath = Path.join(from, entry)
        const targetPath = Path.join(to, entry)

        return fs.stat(sourcePath).pipe(
          Effect.flatMap(fileInfo =>
            fileInfo.type === 'Directory'
              ? copyDirectory(sourcePath, targetPath)
              : fs.copyFile(sourcePath, targetPath)
          ),
          Effect.mapError((error) => new Error(`Failed to copy ${sourcePath}: ${error}`)),
        )
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
  buildPath: string,
  oldBasePath: string,
  newBasePath: string,
): Effect.Effect<void, Error, FileSystem.FileSystem> =>
  findHtmlFiles(buildPath).pipe(
    Effect.flatMap(htmlFiles =>
      Effect.all(
        htmlFiles.map(htmlFile => updateHtmlFile(htmlFile, oldBasePath, newBasePath)),
        { concurrency: 'unbounded' },
      )
    ),
    Effect.asVoid,
  )

const findHtmlFiles = (dir: string): Effect.Effect<string[], Error, never> =>
  Effect.tryPromise({
    try: () =>
      TinyGlobby.glob(`**/*.html`, {
        absolute: true,
        cwd: dir,
        onlyFiles: true,
      }),
    catch: (error) => new Error(`Failed to find HTML files: ${error}`),
  })

const updateHtmlFile = (
  filePath: string,
  oldBasePath: string,
  newBasePath: string,
): Effect.Effect<void, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    const content = yield* fs.readFileString(filePath).pipe(
      Effect.mapError((error) => new Error(`Could not read HTML file ${filePath}: ${error}`)),
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
        return yield* Effect.fail(
          new HtmlProcessingError({
            filePath,
            reason: 'Could not find <head> tag in HTML file',
          }),
        )
      }
    }

    yield* fs.writeFileString(filePath, updatedContent).pipe(
      Effect.mapError((error) => new Error(`Failed to write HTML file ${filePath}: ${error}`)),
    )
  })

const updateManifest = (
  buildPath: string,
  updates: Partial<PolenBuildManifest>,
): Effect.Effect<void, ManifestNotFoundError | Error, FileSystem.FileSystem> =>
  buildManifest.read(buildPath).pipe(
    Effect.flatMap(O.match({
      onNone: () =>
        Effect.fail(
          new ManifestNotFoundError({ path: buildPath }),
        ),
      onSome: (currentManifest) => {
        const updatedManifest = { ...currentManifest, ...updates }
        return buildManifest.write(updatedManifest, buildPath).pipe(
          Effect.mapError((error) =>
            error instanceof Error ? error : new Error(`Failed to write manifest: ${String(error)}`)
          ),
        )
      },
    })),
  )
