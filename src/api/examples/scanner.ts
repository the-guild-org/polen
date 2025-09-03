import { Catalog as SchemaCatalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { EffectGlob } from '#lib/effect-glob/$'
import { Version } from '#lib/version/$'
import { FileSystem } from '@effect/platform'
import { Str } from '@wollybeard/kit'
import { Effect, HashMap, Match } from 'effect'
import * as Path from 'node:path'
import type { Diagnostic } from './diagnostic/diagnostic.js'
import {
  makeDiagnosticDuplicateContent,
  makeDiagnosticMissingVersions,
  makeDiagnosticUnknownVersion,
  makeDiagnosticUnusedDefault,
} from './diagnostic/diagnostic.js'
import { validateExamples } from './diagnostic/validator.js'
import { Catalog } from './schemas/catalog.js'
import { Example } from './schemas/example/$.js'

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

// Pattern for versioned files: <name>.<version>.graphql
const VERSIONED_FILE_PATTERN = Str.pattern<{ groups: ['name', 'version'] }>(
  /^(?<name>.+?)\.(?<version>.+)$/,
)

// ============================================================================
// Helpers
// ============================================================================

const parseExampleFilename = (filename: string): { name: string; version: string | null } => {
  const parsed = Path.parse(filename)
  const base = parsed.name

  // Try to match versioned pattern: <name>.<version>
  const match = Str.match(base, VERSIONED_FILE_PATTERN)

  if (match) {
    const { name, version: versionStr } = match.groups

    // Handle special 'default' keyword
    if (versionStr === 'default') {
      return { name, version: 'default' }
    }
    const decoded = Version.decodeSync(versionStr)
    // Return canonical version string
    return { name, version: Version.toString(decoded) }
  }

  // No version found - this is an unversioned example
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

const lintFileLayout = (
  example: Example.Example,
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

  Match.value(example.document).pipe(
    Match.tagsExhaustive({
      DocumentVersioned: (doc) => {
        // Fully versioned - must have all schema versions
        const versionKeys = Array.from(HashMap.keys(doc.versionDocuments)).map(Version.toString)
        const missingVersions = schemaVersions.filter(sv => !versionKeys.includes(sv))

        if (missingVersions.length > 0) {
          diagnostics.push(makeDiagnosticMissingVersions({
            message: `Fully versioned example must provide documents for all schema versions`,
            example: { name: example.name, path: example.path },
            providedVersions: versionKeys,
            missingVersions,
          }))
        }

        // Check for duplicate content between versions
        const versionEntries = Array.from(HashMap.entries(doc.versionDocuments))
        const duplicates: Array<{ version1: string; version2: string }> = []
        for (let i = 0; i < versionEntries.length; i++) {
          for (let j = i + 1; j < versionEntries.length; j++) {
            const [v1, content1] = versionEntries[i]!
            const [v2, content2] = versionEntries[j]!
            if (content1 === content2) {
              duplicates.push({ version1: Version.toString(v1), version2: Version.toString(v2) })
            }
          }
        }
        if (duplicates.length > 0) {
          diagnostics.push(makeDiagnosticDuplicateContent({
            message: `Multiple versions have identical content, consider using a partially versioned example`,
            example: { name: example.name, path: example.path },
            duplicates,
          }))
        }
      },
      DocumentPartiallyVersioned: (doc) => {
        // Partially versioned - check for unused default
        const versionKeys = Array.from(HashMap.keys(doc.versionDocuments)).map(Version.toString)
        const allVersionsCovered = schemaVersions.every(sv => versionKeys.includes(sv))

        if (allVersionsCovered) {
          diagnostics.push(makeDiagnosticUnusedDefault({
            message: `Default document will never be used because all schema versions have explicit documents`,
            example: { name: example.name, path: example.path },
            versions: versionKeys,
          }))
        }

        // Check for duplicate content between versions and default
        const duplicates: Array<{ version1: string; version2: string }> = []
        for (const [version, content] of HashMap.entries(doc.versionDocuments)) {
          if (doc.defaultDocument === content) {
            duplicates.push({ version1: 'default', version2: Version.toString(version) })
          }
        }
        if (duplicates.length > 0) {
          diagnostics.push(makeDiagnosticDuplicateContent({
            message: `Version duplicates default content, consider removing the duplicate`,
            example: { name: example.name, path: example.path },
            duplicates,
          }))
        }
      },
      DocumentUnversioned: () => {
        // DocumentUnversioned doesn't have version-related diagnostics
      },
    }),
  )

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
    const examples: Example.Example[] = []
    const diagnostics: Diagnostic[] = []

    for (const [name, versions] of groupedFiles) {
      // Check if this is a versioned or unversioned example
      const hasMultipleVersions = versions.size > 1
      const hasUnversionedFile = versions.has(null)
      const hasDefaultFile = versions.has('default')
      const hasOnlyDefaultFile = hasDefaultFile && versions.size === 1

      // Determine the base path for this example
      const firstFilePath = Array.from(versions.values())[0]!
      const basePath = versions.size === 1
        ? firstFilePath
        : Path.dirname(firstFilePath)

      let example: Example.Example

      if (hasUnversionedFile && versions.size === 1) {
        // Unversioned example - single file with no version
        const filePath = versions.get(null)!
        const fullPath = Path.join(options.dir, filePath)
        const document = yield* fs.readFileString(fullPath)

        example = Example.make({
          name,
          path: basePath,
          document: Document.Unversioned.make({
            document,
          }),
        })
      } else if (hasOnlyDefaultFile) {
        // Partially versioned example with only default - no explicit versions
        const filePath = versions.get('default')!
        const fullPath = Path.join(options.dir, filePath)
        const document = yield* fs.readFileString(fullPath)

        example = Example.make({
          name,
          path: basePath,
          document: Document.PartiallyVersioned.make({
            versionDocuments: HashMap.empty(),
            defaultDocument: document,
          }),
        })
      } else {
        // Versioned example - multiple files or versioned files
        let versionDocuments = HashMap.empty<Version.Version, string>()
        let defaultDocument: string | undefined
        const unknownVersions: string[] = []

        // Get available schema versions if catalog is provided
        const schemaVersions: string[] = options.schemaCatalog
          ? SchemaCatalog.fold(
            (versioned) => versioned.entries.map(entry => Version.toString(entry.version)),
            () => [], // Unversioned schemas don't have version-specific examples
          )(options.schemaCatalog)
          : []

        // Read content for each version
        for (const [version, filePath] of versions) {
          const fullPath = Path.join(options.dir, filePath)
          const fileContent = yield* fs.readFileString(fullPath)

          if (version === 'default') {
            defaultDocument = fileContent
          } else if (version !== null) {
            // Check if this version exists in the schema
            if (options.schemaCatalog && schemaVersions.length > 0 && !schemaVersions.includes(version)) {
              unknownVersions.push(version)
              // Create diagnostic for unknown version
              diagnostics.push(makeDiagnosticUnknownVersion({
                message: `Example "${name}" specifies version "${version}" which does not exist in the schema`,
                example: { name, path: basePath },
                version,
                availableVersions: schemaVersions,
              }))
              // Skip this version - don't include it in the example
              continue
            }

            const versionObj = Version.decodeSync(version)
            versionDocuments = HashMap.set(versionDocuments, versionObj, fileContent)
          }
        }

        // Determine which type of example to create
        const hasVersions = HashMap.size(versionDocuments) > 0

        if (hasVersions && defaultDocument) {
          // Has both versions and default = PartiallyVersioned
          example = Example.make({
            name,
            path: basePath,
            document: Document.PartiallyVersioned.make({
              versionDocuments,
              defaultDocument,
            }),
          })
        } else if (hasVersions && !defaultDocument) {
          // Has only versions = Versioned (must cover all schema versions)
          example = Example.make({
            name,
            path: basePath,
            document: Document.Versioned.make({
              versionDocuments,
            }),
          })
        } else if (!hasVersions && defaultDocument) {
          // Has only default = PartiallyVersioned
          example = Example.make({
            name,
            path: basePath,
            document: Document.PartiallyVersioned.make({
              versionDocuments: HashMap.empty(),
              defaultDocument,
            }),
          })
        } else if (unknownVersions.length > 0) {
          // All versions were unknown, skip this example entirely
          continue
        } else {
          // No versions and no default - shouldn't happen
          continue
        }
      }

      if (example) {
        examples.push(example)
        // Generate diagnostics for this example
        diagnostics.push(...lintFileLayout(example, options.schemaCatalog))
      }
    }

    // Perform validation if catalog is provided
    if (options.schemaCatalog) {
      diagnostics.push(...validateExamples(examples, options.schemaCatalog))
    }

    // @claude create a utility for reading a file at variable paths
    // Check for index.md or index.mdx file
    const indexMdPath = Path.join(options.dir, 'index.md')
    const indexMdxPath = Path.join(options.dir, 'index.mdx')

    // Try index.md first, then index.mdx
    const indexPath = (yield* fs.exists(indexMdPath))
      ? indexMdPath
      : (yield* fs.exists(indexMdxPath))
      ? indexMdxPath
      : null

    const catalog = Catalog.make({
      examples,
      index: indexPath ? { path: indexPath } : undefined,
    })
    return { catalog, diagnostics }
  })
