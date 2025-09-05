import { Catalog as SchemaCatalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { EffectGlob } from '#lib/effect-glob/$'
import { VersionCoverage } from '#lib/version-selection/$'
import { Version } from '#lib/version/$'
import { FileSystem } from '@effect/platform'
import { Str } from '@wollybeard/kit'
import { Effect, HashMap, HashSet, Match } from 'effect'
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
    return { name, version: Version.encodeSync(decoded) }
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
  const schemaVersions: Version.Version[] = schemaCatalog
    ? SchemaCatalog.fold(
      (versioned) => SchemaCatalog.Versioned.getVersions(versioned),
      (unversioned) => [], // Unversioned doesn't have Version objects, just dates
    )(schemaCatalog)
    : []

  const diagnostics: Diagnostic[] = []

  Match.value(example.document).pipe(
    Match.tagsExhaustive({
      DocumentVersioned: (doc) => {
        // Get all versions covered by this document
        const coveredVersions = Document.Versioned.getAllVersions(doc)
        const missingVersions = schemaVersions.filter(sv => !coveredVersions.some(cv => Version.equivalence(sv, cv)))

        if (missingVersions.length > 0) {
          diagnostics.push(makeDiagnosticMissingVersions({
            message: `Versioned example must provide documents for all schema versions`,
            example: { name: example.name, path: example.path },
            providedVersions: coveredVersions,
            missingVersions,
          }))
        }

        // Check for duplicate content between selections
        const entries = Array.from(HashMap.entries(doc.versionDocuments))
        const duplicates: Array<{ version1: string; version2: string }> = []
        for (let i = 0; i < entries.length; i++) {
          for (let j = i + 1; j < entries.length; j++) {
            const [sel1, content1] = entries[i]!
            const [sel2, content2] = entries[j]!
            if (content1 === content2) {
              duplicates.push({
                version1: VersionCoverage.toLabel(sel1),
                version2: VersionCoverage.toLabel(sel2),
              })
            }
          }
        }
        if (duplicates.length > 0) {
          diagnostics.push(makeDiagnosticDuplicateContent({
            message: `Multiple version selections have identical content, consider combining them`,
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
        // Only default file - create versioned document with all schema versions as a set
        const filePath = versions.get('default')!
        const fullPath = Path.join(options.dir, filePath)
        const documentContent = yield* fs.readFileString(fullPath)

        // Get all schema versions to map to this default document
        const schemaVersions: Version.Version[] = options.schemaCatalog
          ? SchemaCatalog.fold(
            (versioned) => SchemaCatalog.Versioned.getVersions(versioned),
            () => [], // Unversioned schemas don't have version-specific examples
          )(options.schemaCatalog)
          : []

        if (schemaVersions.length > 0) {
          // Create a version set for all schema versions
          const versionSet = HashSet.fromIterable(schemaVersions)
          let versionDocuments = HashMap.empty<VersionCoverage.VersionCoverage, string>()
          versionDocuments = HashMap.set(versionDocuments, versionSet, documentContent)

          example = Example.make({
            name,
            path: basePath,
            document: Document.Versioned.make({
              versionDocuments,
            }),
          })
        } else {
          // No schema versions, treat as unversioned
          example = Example.make({
            name,
            path: basePath,
            document: Document.Unversioned.make({
              document: documentContent,
            }),
          })
        }
      } else {
        // Versioned example - multiple files or versioned files
        let versionDocuments = HashMap.empty<VersionCoverage.VersionCoverage, string>()
        let defaultDocument: string | undefined
        let explicitVersions = HashSet.empty<Version.Version>() // Track which versions have explicit files
        const unknownVersions: Version.Version[] = []

        // Get available schema versions if catalog is provided
        const schemaVersions: Version.Version[] = options.schemaCatalog
          ? SchemaCatalog.fold(
            (versioned) => SchemaCatalog.Versioned.getVersions(versioned),
            () => [], // Unversioned schemas don't have version-specific examples
          )(options.schemaCatalog)
          : []
        
        // Create HashSet for O(1) lookups
        const schemaVersionsSet = HashSet.fromIterable(schemaVersions)

        // Read content for each version
        for (const [version, filePath] of versions) {
          const fullPath = Path.join(options.dir, filePath)
          const fileContent = yield* fs.readFileString(fullPath)

          if (version === 'default') {
            defaultDocument = fileContent
          } else if (version !== null) {
            // Parse the version string
            const parsedVersion = Version.decodeSync(version)
            // Check if this version exists in the schema
            const versionExists = HashSet.has(schemaVersionsSet, parsedVersion)
            if (options.schemaCatalog && schemaVersions.length > 0 && !versionExists) {
              unknownVersions.push(parsedVersion)
              // Create diagnostic for unknown version
              diagnostics.push(makeDiagnosticUnknownVersion({
                message: `Example "${name}" specifies version "${version}" which does not exist in the schema`,
                example: { name, path: basePath },
                version: parsedVersion,
                availableVersions: schemaVersions,
              }))
              // Skip this version - don't include it in the example
              continue
            }

            // We already have parsedVersion from above
            versionDocuments = HashMap.set(versionDocuments, parsedVersion, fileContent)
            explicitVersions = HashSet.add(explicitVersions, parsedVersion)
          }
        }

        if (defaultDocument) {
          // If we have a default, determine which versions it applies to
          const defaultVersions = schemaVersions.filter(v => !HashSet.has(explicitVersions, v))

          if (defaultVersions.length > 0) {
            // Create a version set for the default document
            const defaultVersionSet = defaultVersions.length === 1
              ? defaultVersions[0]! // Single version
              : HashSet.fromIterable(defaultVersions) // Version set

            versionDocuments = HashMap.set(versionDocuments, defaultVersionSet, defaultDocument)
          }
        }

        if (HashMap.size(versionDocuments) > 0) {
          // Create versioned document
          example = Example.make({
            name,
            path: basePath,
            document: Document.Versioned.make({
              versionDocuments,
            }),
          })
        } else if (unknownVersions.length > 0) {
          // All versions were unknown, skip this example entirely
          continue
        } else {
          // No versions at all - shouldn't happen
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
