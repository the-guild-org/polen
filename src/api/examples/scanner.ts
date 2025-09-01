import * as FileSystem from '@effect/platform/FileSystem'
import { Path } from '@wollybeard/kit'
import { Effect } from 'effect'
import type { Diagnostic } from './diagnostics.js'
import { DiagnosticDuplicateContent, DiagnosticMissingVersions, DiagnosticUnusedDefault } from './diagnostics.js'
import type { Example } from './example.js'
import * as ExampleModule from './example.js'

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

const parseExampleFilename = (filename: string): { name: string; version: string } => {
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

  // It's a simple file (e.g., example.graphql)
  return { name: base, version: 'default' }
}

const groupExampleFiles = (files: string[]): Map<string, Map<string, string>> => {
  const grouped = new Map<string, Map<string, string>>()

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
  fileContents: Map<string, string>,
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []

  // Check for unused default
  if (example.versions.includes('default') && example.versions.length > 1) {
    const nonDefaultVersions = example.versions.filter(v => v !== 'default')
    const allVersionsCovered = schemaVersions.every(sv => nonDefaultVersions.some(v => v === sv))

    if (allVersionsCovered) {
      const diagnostic = DiagnosticUnusedDefault.make({
        message: `Default example file will never be used because explicit versions exist for all schema versions`,
        example: {
          id: example.id,
          path: example.path,
        },
        versions: nonDefaultVersions,
      })
      diagnostics.push(diagnostic)
    }
  }

  // Check for duplicate content
  const duplicates: Array<{ version1: string; version2: string }> = []
  const versions = Array.from(example.versions)
  for (let i = 0; i < versions.length; i++) {
    for (let j = i + 1; j < versions.length; j++) {
      const v1 = versions[i]!
      const v2 = versions[j]!
      const content1 = example.content[v1]
      const content2 = example.content[v2]
      if (content1 === content2) {
        duplicates.push({ version1: v1, version2: v2 })
      }
    }
  }

  if (duplicates.length > 0) {
    const diagnostic = DiagnosticDuplicateContent.make({
      message: `Multiple versions of example have identical content, consider consolidating`,
      example: {
        id: example.id,
        path: example.path,
      },
      duplicates,
    })
    diagnostics.push(diagnostic)
  }

  // Check for missing versions
  if (!example.versions.includes('default')) {
    const missingVersions = schemaVersions.filter(sv => !example.versions.includes(sv))

    if (missingVersions.length > 0) {
      const diagnostic = DiagnosticMissingVersions.make({
        message: `Example does not provide content for all schema versions`,
        example: {
          id: example.id,
          path: example.path,
        },
        providedVersions: example.versions,
        missingVersions,
      })
      diagnostics.push(diagnostic)
    }
  }

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

    // Find all example files - allow override for testing
    const files = options.files ?? (yield* Effect.gen(function*() {
      const { EffectGlobby } = yield* Effect.promise(() => import('#dep/tiny-globby/index'))
      return yield* EffectGlobby.glob(pattern, { cwd: options.dir })
    }))

    // Group files by example
    const groupedFiles = groupExampleFiles(files)

    // Process each example group
    const examples: Example[] = []
    const diagnostics: Diagnostic[] = []

    for (const [name, versions] of groupedFiles) {
      const content: Record<string, string> = {}

      // Read content for each version
      for (const [version, filePath] of versions) {
        const fullPath = Path.join(options.dir, filePath)
        const fileContent = yield* fs.readFileString(fullPath)
        content[version] = fileContent
      }

      // Determine the base path for this example
      const basePath = versions.size === 1 && versions.has('default')
        ? versions.get('default')!
        : Path.dirname(Array.from(versions.values())[0]!)

      const example = ExampleModule.make({
        id: name,
        path: basePath,
        versions: Array.from(versions.keys()),
        content,
      })

      examples.push(example)

      // Generate diagnostics for this example
      const exampleDiagnostics = createDiagnostics(example, options.schemaVersions, versions)
      diagnostics.push(...exampleDiagnostics)
    }

    return { examples, diagnostics }
  })
