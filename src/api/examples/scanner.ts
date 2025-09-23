import { Ar, Ef, Op } from '#dep/effect'
import { FileSystem } from '@effect/platform'
import { Fs, FsLoc, Str } from '@wollybeard/kit'
import { HashMap, HashSet, Match } from 'effect'
import { Catalog as SchemaCatalog, Document, Version, VersionCoverage } from 'graphql-kit'
import type { Diagnostic } from './diagnostic/diagnostic.js'
import {
  makeDiagnosticDuplicateContent,
  makeDiagnosticMissingVersions,
  makeDiagnosticUnknownVersion,
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
  dir: FsLoc.AbsDir.AbsDir
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
// File Parsing Types
// ============================================================================

type ParsedExampleFile =
  | { type: 'unversioned'; name: string; file: FsLoc.RelFile.RelFile }
  | { type: 'versioned'; name: string; version: Version.Version; file: FsLoc.RelFile.RelFile }

type GroupedExampleFiles = Map<string, {
  unversioned?: FsLoc.RelFile.RelFile
  versioned: Map<Version.Version, FsLoc.RelFile.RelFile>
}>

// ============================================================================
// Helpers
// ============================================================================

export const parseExampleFile = (file: FsLoc.RelFile.RelFile): ParsedExampleFile => {
  const base = FsLoc.name(file)

  // Try to match versioned pattern: <name>.<version>
  const opMatch = Str.match(base, VERSIONED_FILE_PATTERN)

  if (Op.isSome(opMatch)) {
    const { name, version: versionStr } = opMatch.value.groups
    const version = Version.decodeSync(versionStr)
    return { type: 'versioned', name, version, file }
  }

  // No version found - this is an unversioned example
  return { type: 'unversioned', name: base, file }
}

const groupExampleFiles = (files: FsLoc.RelFile.RelFile[]): GroupedExampleFiles => {
  const grouped: GroupedExampleFiles = new Map()

  for (const file of files) {
    const parsed = parseExampleFile(file)

    if (!grouped.has(parsed.name)) {
      grouped.set(parsed.name, {
        versioned: new Map(),
      })
    }

    const group = grouped.get(parsed.name)!

    switch (parsed.type) {
      case 'unversioned':
        group.unversioned = parsed.file
        break
      case 'versioned':
        group.versioned.set(parsed.version, parsed.file)
        break
    }
  }

  return grouped
}

/**
 * Resolve .default files into proper version coverage.
 * This erases the .default convention and converts it to semantic version sets.
 */
export const resolveDefaultFiles = (
  grouped: GroupedExampleFiles,
  schemaVersions: Version.Version[],
): Map<string, {
  versionDocuments: HashMap.HashMap<VersionCoverage.VersionCoverage, FsLoc.RelFile.RelFile>
  unversioned?: FsLoc.RelFile.RelFile
}> => {
  const resolved = new Map<string, {
    versionDocuments: HashMap.HashMap<VersionCoverage.VersionCoverage, FsLoc.RelFile.RelFile>
    unversioned?: FsLoc.RelFile.RelFile
  }>()

  for (const [name, group] of grouped) {
    let versionDocuments = HashMap.empty<VersionCoverage.VersionCoverage, FsLoc.RelFile.RelFile>()

    // Add explicit versions
    for (const [version, file] of group.versioned) {
      versionDocuments = HashMap.set(versionDocuments, version, file)
    }

    // Handle unversioned file
    if (group.unversioned && group.versioned.size > 0) {
      // When both unversioned and versioned exist, use unversioned as default for missing versions
      const explicitVersions = HashSet.fromIterable(group.versioned.keys())
      const defaultVersions = schemaVersions.filter(v => !HashSet.has(explicitVersions, v))

      if (defaultVersions.length > 0) {
        // Create version coverage for default
        const defaultCoverage = defaultVersions.length === 1
          ? defaultVersions[0]! // Single version
          : HashSet.fromIterable(defaultVersions) // Version set

        versionDocuments = HashMap.set(versionDocuments, defaultCoverage, group.unversioned)
      }
      // Don't add to resolved.unversioned since it's acting as a default
      resolved.set(name, { versionDocuments })
    } else if (group.unversioned) {
      // Only unversioned exists - truly unversioned
      resolved.set(name, {
        versionDocuments,
        unversioned: group.unversioned,
      })
    } else {
      // Only versioned files exist
      resolved.set(name, { versionDocuments })
    }
  }

  return resolved
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
        const missingVersions = Ar.filter(
          schemaVersions,
          sv => !Ar.some(coveredVersions, cv => Version.equivalence(sv, cv)),
        )

        if (missingVersions.length > 0) {
          diagnostics.push(makeDiagnosticMissingVersions({
            message: `Versioned example must provide documents for all schema versions`,
            example: { name: example.name, path: example.path },
            providedVersions: coveredVersions,
            missingVersions,
          }))
        }

        // Check for duplicate content between selections
        const entries = [...HashMap.entries(doc.versionDocuments)]
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
  options: ScanOptions & { files?: FsLoc.RelFile.RelFile[] },
): Ef.Effect<ScanResult, Error, FileSystem.FileSystem> =>
  Ef.gen(function*() {
    const extensions = options.extensions ?? DEFAULT_EXTENSIONS
    const pattern = `**/*.{${extensions.join(',')}}`
    const files = options.files ?? (yield* Fs.glob(pattern, { cwd: options.dir }))
    // Get schema versions upfront for default file resolution
    const schemaVersions: Version.Version[] = options.schemaCatalog
      ? SchemaCatalog.fold(
        (versioned) => SchemaCatalog.Versioned.getVersions(versioned),
        () => [], // Unversioned schemas don't have version-specific examples
      )(options.schemaCatalog)
      : []

    // Group files by example
    const groupedFiles = groupExampleFiles(files)

    // Resolve .default files into proper version coverage immediately
    const resolvedFiles = resolveDefaultFiles(groupedFiles, schemaVersions)

    // Process each example group
    const examples: Example.Example[] = []
    const diagnostics: Diagnostic[] = []

    for (const [name, resolved] of resolvedFiles) {
      // Determine the base path for this example
      const firstFile = resolved.unversioned
        || (HashMap.size(resolved.versionDocuments) > 0
          ? HashMap.values(resolved.versionDocuments).next().value
          : undefined)
      if (!firstFile) continue // No files for this example

      // For now, use the encoded file path as the base path
      // This will be a string path for the example
      const basePath = FsLoc.RelFile.encodeSync(firstFile)

      let example: Example.Example | undefined

      if (resolved.unversioned) {
        // Unversioned example - single file with no version
        const fullPathLoc = FsLoc.join(options.dir, resolved.unversioned)
        const document = yield* Fs.readString(fullPathLoc)

        example = Example.make({
          name,
          path: basePath,
          document: Document.Unversioned.make({
            document,
          }),
        })
      } else if (HashMap.size(resolved.versionDocuments) > 0) {
        // Versioned example - read all version documents
        let versionDocuments = HashMap.empty<VersionCoverage.VersionCoverage, string>()
        const unknownVersions: Version.Version[] = []
        const schemaVersionsSet = HashSet.fromIterable(schemaVersions)

        for (const [versionCoverage, filePath] of HashMap.entries(resolved.versionDocuments)) {
          // Check if version is known (only for single versions, not sets)
          if (Version.is(versionCoverage)) {
            const versionExists = HashSet.has(schemaVersionsSet, versionCoverage)
            if (options.schemaCatalog && schemaVersions.length > 0 && !versionExists) {
              unknownVersions.push(versionCoverage)
              // Create diagnostic for unknown version
              diagnostics.push(makeDiagnosticUnknownVersion({
                message: `Example "${name}" specifies version "${
                  Version.encodeSync(versionCoverage)
                }" which does not exist in the schema`,
                example: { name, path: basePath },
                version: versionCoverage,
                availableVersions: schemaVersions,
              }))
              // Skip this version - don't include it in the example
              continue
            }
          }

          const fullPathLoc = FsLoc.join(options.dir, filePath)
          const fileContent = yield* Fs.readString(fullPathLoc)

          versionDocuments = HashMap.set(versionDocuments, versionCoverage, fileContent)
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
        }
      }

      if (example) {
        // Check for description.md or description.mdx file
        const descriptionMdFile = FsLoc.RelFile.decodeSync(`${name}.md`)
        const descriptionMdxFile = FsLoc.RelFile.decodeSync(`${name}.mdx`)
        const descriptionMdPathLoc = FsLoc.join(options.dir, descriptionMdFile)
        const descriptionMdxPathLoc = FsLoc.join(options.dir, descriptionMdxFile)

        const descriptionPath = (yield* Fs.exists(descriptionMdPathLoc))
          ? FsLoc.encodeSync(descriptionMdPathLoc)
          : (yield* Fs.exists(descriptionMdxPathLoc))
          ? FsLoc.encodeSync(descriptionMdxPathLoc)
          : null

        if (descriptionPath) {
          example = { ...example, description: { path: descriptionPath } }
        }

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
    const indexMdFile = FsLoc.fromString('index.md')
    const indexMdxFile = FsLoc.fromString('index.mdx')
    const indexMdPathLoc = FsLoc.join(options.dir, indexMdFile)
    const indexMdxPathLoc = FsLoc.join(options.dir, indexMdxFile)

    // Try index.md first, then index.mdx
    const indexPath = (yield* Fs.exists(indexMdPathLoc))
      ? FsLoc.encodeSync(indexMdPathLoc)
      : (yield* Fs.exists(indexMdxPathLoc))
      ? FsLoc.encodeSync(indexMdxPathLoc)
      : null

    const catalog = Catalog.make({
      examples,
      index: indexPath ? { path: indexPath } : undefined,
    })
    return { catalog, diagnostics }
  })
