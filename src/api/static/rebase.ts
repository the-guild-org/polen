import { TinyGlobby } from '#dep/tiny-globby/index'
import { S } from '#lib/kit-temp/effect'
import { FileSystem } from '@effect/platform'
import { NodeFileSystem } from '@effect/platform-node'
import { Effect, Exit } from 'effect'
import * as NodePath from 'node:path'
import { buildManifest, type PolenBuildManifest } from './manifest.js'

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

export const rebase = async (plan: RebasePlan): Promise<void> => {
  const rebaseEffect = Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // 1. Validate source is a Polen build
    const manifestResult = yield* Effect.promise(() => buildManifest.read(plan.sourcePath))
    if (Exit.isFailure(manifestResult)) {
      return yield* Effect.fail(
        new Error(`Polen build manifest not found at: ${NodePath.join(plan.sourcePath, `.polen`, `build.json`)}`),
      )
    }
    const manifest = manifestResult.value

    // 2. Validate newBasePath is valid URL path
    if (!isValidUrlPath(plan.newBasePath)) {
      return yield* Effect.fail(new Error(`Invalid base path: ${plan.newBasePath}`))
    }

    // 3. Handle copy vs mutate
    let workingPath: string
    if (plan.changeMode === `copy`) {
      const targetExists = yield* fs.exists(plan.targetPath)
      if (targetExists) {
        const isEmpty = yield* isEmptyDirectory(plan.targetPath)
        if (!isEmpty) {
          return yield* Effect.fail(
            new Error(`Target path already exists and is not empty: ${plan.targetPath}`),
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

  return Effect.runPromise(
    rebaseEffect.pipe(
      Effect.provide(NodeFileSystem.layer),
    ),
  )
}

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

    // Copy each entry
    for (const entry of entries) {
      const sourcePath = NodePath.join(from, entry)
      const targetPath = NodePath.join(to, entry)

      const fileInfo = yield* fs.stat(sourcePath).pipe(
        Effect.mapError((error) => new Error(`Failed to stat ${sourcePath}: ${error}`)),
      )

      if (fileInfo.type === 'Directory') {
        yield* copyDirectory(sourcePath, targetPath)
      } else {
        yield* fs.copyFile(sourcePath, targetPath).pipe(
          Effect.mapError((error) => new Error(`Failed to copy file ${sourcePath}: ${error}`)),
        )
      }
    }
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
  Effect.gen(function*() {
    // Find all HTML files recursively
    const htmlFiles = yield* findHtmlFiles(buildPath)

    // Update all HTML files in parallel
    yield* Effect.all(
      htmlFiles.map(htmlFile => updateHtmlFile(htmlFile, oldBasePath, newBasePath)),
      { concurrency: 'unbounded' },
    )
  })

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
          new Error(`Could not find <head> tag in HTML file: ${filePath}`),
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
): Effect.Effect<void, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const manifestPath = NodePath.join(buildPath, `.polen`, `build.json`)
    const manifestResult = yield* Effect.promise(() => buildManifest.read(buildPath))

    if (Exit.isFailure(manifestResult)) {
      return yield* Effect.fail(
        new Error(`Polen build manifest not found at: ${manifestPath}`),
      )
    }
    const currentManifest = manifestResult.value

    const updatedManifest = { ...currentManifest, ...updates }

    const writeResult = yield* Effect.promise(() => buildManifest.write(updatedManifest, buildPath))
    if (Exit.isFailure(writeResult)) {
      const error = writeResult.cause
      return yield* Effect.fail(
        new Error(`Failed to write manifest: ${error}`),
      )
    }
  })
