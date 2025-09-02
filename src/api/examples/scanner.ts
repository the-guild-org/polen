import { EffectGlob } from '#lib/effect-glob/$'
import { FileSystem } from '@effect/platform'
import { Path } from '@wollybeard/kit'
import { Effect } from 'effect'
import type { Diagnostic } from './diagnostics.js'
import {
  makeDiagnosticDuplicateContent,
  makeDiagnosticMissingVersions,
  makeDiagnosticUnusedDefault,
} from './diagnostics.js'
import type { Example } from './example.js'
import * as UnversionedExample from './unversioned.js'
import * as VersionedExample from './versioned.js'

// ============================================================================
// Types
// ============================================================================

export interface ScanResult {
  examples: Example[]
  diagnostics: Diagnostic[]
}

export interface ScanOptions {
  dir: string
  schemaVersions: string[]
  extensions?: string[]
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_EXTENSIONS = ['graphql', 'gql']
const VERSION_PATTERN = /^v\d+$/

// ============================================================================
// Helpers
// ============================================================================

const parseExampleFilename = (filename: string): { name: string; version: string | null } => {
  const base = Path.parse(filename).name

  // Check if it's a versioned file (e.g., example.v1.graphql)
  const parts = base.split('.')
  if (parts.length === 2 && parts[1] && VERSION_PATTERN.test(parts[1])) {
    return { name: parts[0]!, version: parts[1] }
  }

  // Check if it's a default file
  if (base === 'default') {
    const dirName = Path.parse(Path.dirname(filename)).name
    return { name: dirName || 'unknown', version: 'default' }
  }

  // Check if it's a versioned file in a directory (e.g., example/v1.graphql)
  if (VERSION_PATTERN.test(base)) {
    const dirName = Path.parse(Path.dirname(filename)).name
    return { name: dirName || 'unknown', version: base }
  }

  // It's a simple file (e.g., example.graphql) - unversioned
  return { name: base, version: null }
}

const groupExampleFiles = (files: string[]): Map<string, Map<string | null, string>> => {
  const grouped = new Map<string, Map<string | null, string>>()

  for (const file of files) {
    const { name, version } = parseExampleFilename(file)

    if (!grouped.has(name)) {
      grouped.set(name, new Map())
    }
    grouped.get(name)!.set(version, file)
  }

  return grouped
}

const createDiagnostics = (
  example: Example,
  schemaVersions: string[],
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []

  if (example._tag === 'ExampleVersioned') {
    const versionKeys = Object.keys(example.versionDocuments)

    // Check for unused default versions
    if (example.defaultDocument && versionKeys.length > 0) {
      const allVersionsCovered = schemaVersions.every(sv => versionKeys.includes(sv))

      if (allVersionsCovered) {
        const diagnostic = makeDiagnosticUnusedDefault({
          message:
            `Default example document will never be used because explicit versions exist for all schema versions`,
          example: {
            name: example.name,
            path: example.path,
          },
          versions: versionKeys,
        })
        diagnostics.push(diagnostic)
      }
    }

    // Check for duplicate content
    const duplicates: Array<{ version1: string; version2: string }> = []
    const versionEntries = Object.entries(example.versionDocuments)
    for (let i = 0; i < versionEntries.length; i++) {
      for (let j = i + 1; j < versionEntries.length; j++) {
        const [v1, content1] = versionEntries[i]!
        const [v2, content2] = versionEntries[j]!
        if (content1 === content2) {
          duplicates.push({ version1: v1, version2: v2 })
        }
      }
    }

    // Also check if default document duplicates any version
    if (example.defaultDocument) {
      for (const [version, content] of versionEntries) {
        if (example.defaultDocument === content) {
          duplicates.push({ version1: 'default', version2: version })
        }
      }
    }

    if (duplicates.length > 0) {
      const diagnostic = makeDiagnosticDuplicateContent({
        message: `Multiple versions of example have identical content, consider consolidating`,
        example: {
          name: example.name,
          path: example.path,
        },
        duplicates,
      })
      diagnostics.push(diagnostic)
    }

    // Check for missing versions
    if (!example.defaultDocument) {
      const missingVersions = schemaVersions.filter(sv => !versionKeys.includes(sv))

      if (missingVersions.length > 0) {
        const diagnostic = makeDiagnosticMissingVersions({
          message: `Example does not provide content for all schema versions`,
          example: {
            name: example.name,
            path: example.path,
          },
          providedVersions: versionKeys,
          missingVersions,
        })
        diagnostics.push(diagnostic)
      }
    }
  }
  // Unversioned examples don't have version-related diagnostics

  return diagnostics
}

// ============================================================================
// Scanner
// ============================================================================

export const scan = (
  options: ScanOptions & { files?: string[] },
): Effect.Effect<ScanResult, Error, FileSystem.FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const extensions = options.extensions ?? DEFAULT_EXTENSIONS
    const pattern = `**/*.{${extensions.join(',')}}`
    const files = options.files ?? (yield* EffectGlob.glob(pattern, { cwd: options.dir }))

    // Group files by example
    const groupedFiles = groupExampleFiles(files)

    // Process each example group
    const examples: Example[] = []
    const diagnostics: Diagnostic[] = []

    for (const [name, versions] of groupedFiles) {
      // Check if this is a versioned or unversioned example
      const hasMultipleVersions = versions.size > 1
      const hasUnversionedFile = versions.has(null)
      const hasDefaultFile = versions.has('default')

      // Determine the base path for this example
      const firstFilePath = Array.from(versions.values())[0]!
      const basePath = versions.size === 1
        ? firstFilePath
        : Path.dirname(firstFilePath)

      let example: Example

      if (hasUnversionedFile && versions.size === 1) {
        // Unversioned example - single file with no version
        const filePath = versions.get(null)!
        const fullPath = Path.join(options.dir, filePath)
        const document = yield* fs.readFileString(fullPath)

        example = UnversionedExample.make({
          name,
          path: basePath,
          document,
        })
      } else {
        // Versioned example - multiple files or versioned files
        const versionDocuments: Record<string, string> = {}
        let defaultDocument: string | undefined

        // Read content for each version
        for (const [version, filePath] of versions) {
          const fullPath = Path.join(options.dir, filePath)
          const fileContent = yield* fs.readFileString(fullPath)

          if (version === 'default') {
            defaultDocument = fileContent
          } else if (version !== null) {
            // Convert version string to standardized format
            let versionKey: string
            if (version.startsWith('v') && /^v\d+$/.test(version)) {
              // Keep as v1, v2, etc for integer versions
              versionKey = version
            } else {
              // Use as-is for other version formats
              versionKey = version
            }
            versionDocuments[versionKey] = fileContent
          }
        }

        example = VersionedExample.make({
          name,
          path: basePath,
          versionDocuments,
          defaultDocument,
        })
      }

      examples.push(example)

      // Generate diagnostics for this example
      const exampleDiagnostics = createDiagnostics(example, options.schemaVersions)
      diagnostics.push(...exampleDiagnostics)
    }

    return { examples, diagnostics }
  })
