import { Catalog as SchemaCatalog } from '#lib/catalog/$'
import { EffectGlob } from '#lib/effect-glob/$'
import { Version } from '#lib/version/$'
import { FileSystem } from '@effect/platform'
import { Path } from '@wollybeard/kit'
import { Effect, Match } from 'effect'
import { Catalog } from './catalog.js'
import type { Diagnostic } from './diagnostics.js'
import {
  makeDiagnosticDuplicateContent,
  makeDiagnosticMissingVersions,
  makeDiagnosticUnusedDefault,
} from './diagnostics.js'
import type { Example } from './example.js'
import * as UnversionedExample from './unversioned.js'
import { validateExamples } from './validator.js'
import * as VersionedExample from './versioned.js'

// ============================================================================
// Types
// ============================================================================

export interface ScanResult {
  catalog: Catalog
  diagnostics: Diagnostic[]
}

export interface ScanOptions {
  dir: string
  extensions?: string[]
  schemaCatalog?: SchemaCatalog.Catalog
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

/**
 * Validates examples against a catalog with version-aware logic
 */
const lintExamplesContent = (
  examples: Example[],
  schemaCatalog: SchemaCatalog.Catalog,
): Diagnostic[] => {
  return Match.value(schemaCatalog).pipe(
    Match.tagsExhaustive({
      CatalogVersioned: (versioned) => {
        // For versioned catalog, validate each example appropriately
        const diagnostics: Diagnostic[] = []

        for (const example of examples) {
          if (example._tag === 'ExampleVersioned') {
            // For each schema version, validate the matching example version
            for (const entry of versioned.entries) {
              const versionStr = Version.toString(entry.version)
              const exampleDoc = example.versionDocuments[versionStr] ?? example.defaultDocument

              if (exampleDoc) {
                // Validate this version
                const validationDiags = validateExamples(
                  [{
                    ...example,
                    // Create a temporary unversioned example for validation
                    _tag: 'ExampleUnversioned' as const,
                    document: exampleDoc,
                  }],
                  entry.definition,
                )
                diagnostics.push(...validationDiags)
              }
            }
          } else {
            // Unversioned example with versioned catalog - use latest schema
            const latestEntry = versioned.entries[0]!
            const validationDiags = validateExamples([example], latestEntry.definition)
            diagnostics.push(...validationDiags)
          }
        }

        return diagnostics
      },
      CatalogUnversioned: (unversioned) => {
        // For unversioned catalog, only unversioned examples are valid
        const diagnostics: Diagnostic[] = []

        for (const example of examples) {
          if (example._tag === 'ExampleUnversioned') {
            // Validate unversioned example against unversioned schema
            const validationDiags = validateExamples([example], unversioned.schema.definition)
            diagnostics.push(...validationDiags)
          } else {
            // Versioned example with unversioned catalog is an error
            // todo: This should be caught by other diagnostics
          }
        }

        return diagnostics
      },
    }),
  )
}

const lintFileLayout = (
  example: Example,
  schemaCatalog?: SchemaCatalog.Catalog,
): Diagnostic[] => {
  // Extract schema versions from catalog if provided
  const schemaVersions: string[] = schemaCatalog
    ? SchemaCatalog.fold(
      (versioned) => versioned.entries.map(entry => Version.toString(entry.version)),
      (unversioned) => unversioned.schema.revisions?.map(r => r.date) ?? [],
    )(schemaCatalog)
    : []

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
      diagnostics.push(...lintFileLayout(example, options.schemaCatalog))
    }

    // Perform validation if catalog is provided
    if (options.schemaCatalog) {
      diagnostics.push(...lintExamplesContent(examples, options.schemaCatalog))
    }

    const catalog = Catalog.make({ examples })
    return { catalog, diagnostics }
  })
