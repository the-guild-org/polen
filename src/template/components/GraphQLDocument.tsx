import { Catalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { Version } from '#lib/version/$'
import { Box } from '@radix-ui/themes'
import { HashMap, Match, Option } from 'effect'
import type { GraphQLSchema } from 'graphql'
import * as React from 'react'
import { useHighlighted } from '../hooks/use-highlighted.js'
import { GraphQLInteractive } from './GraphQLInteractive/GraphQLInteractive.js'
import { SimpleVersionPicker } from './SimpleVersionPicker.js'

interface GraphQLDocumentProps {
  /** The document containing the GraphQL content */
  document: Document.Document

  /** Optional GraphQL schema catalog for validation and interactivity */
  schemaCatalog?: Catalog.Catalog | undefined

  /** Whether to show version picker for versioned examples */
  showVersionPicker?: boolean

  /** Callback when version changes */
  onVersionChange?: (version: Version.Version) => void

  /** Override the initial/selected version */
  selectedVersion?: Version.Version

  /** Optional custom styles */
  style?: React.CSSProperties
}

/**
 * Unified component for displaying GraphQL documents with optional version selection.
 * Handles all document types: Unversioned, Versioned, and PartiallyVersioned.
 */
export const GraphQLDocument: React.FC<GraphQLDocumentProps> = ({
  document,
  schemaCatalog,
  showVersionPicker = true,
  onVersionChange,
  selectedVersion: controlledVersion,
  style,
}) => {
  /// ━ VERSION MANAGEMENT
  const isControlled = controlledVersion !== undefined
  const [internalVersion, setInternalVersion] = React.useState<Version.Version | null>(
    Catalog.getLatestVersionIdentifier(schemaCatalog),
  )
  const selectedVersion = isControlled ? controlledVersion : internalVersion
  const internalOnVersionChange = (version: Version.Version) => {
    if (!isControlled) {
      setInternalVersion(version)
    }
    onVersionChange?.(version)
  }

  /// ━ DATA RESOLUTION
  const {
    availableVersions,
    schema,
    document: content,
  } = resolveVersion(document, selectedVersion, schemaCatalog)

  const highlightedCode = useHighlighted(content, { interactive: true })

  if (!highlightedCode) {
    return null
  }

  return (
    <GraphQLInteractive
      codeblock={highlightedCode}
      schema={schema}
      style={style}
      toolbar={() => (
        showVersionPicker && selectedVersion && (
          <SimpleVersionPicker
            versions={availableVersions}
            currentVersion={selectedVersion}
            onVersionChange={internalOnVersionChange}
            label='Version'
          />
        )
      )}
    />
  )
}

/**
 * Matches a document with an optional schema catalog, returning the document content,
 * corresponding schema, and available versions for the selected version.
 *
 * @param document - The document to retrieve content from (required)
 * @param selectedVersion - The version to select (optional, defaults to latest)
 * @param schemaCatalog - The schema catalog to match against (optional)
 * @returns Object with document content, optional schema, and available versions
 * @throws {Error} If versions in catalog don't match versions in document
 */
const resolveVersion = (
  document: Document.Document,
  selectedVersion?: Version.Version | null,
  schemaCatalog?: Catalog.Catalog,
): { document: string; schema?: GraphQLSchema; availableVersions: (Version.Version)[] } => {
  // Determine available versions based on document type
  const availableVersions: (Version.Version)[] = Match.value(document).pipe(
    Match.tagsExhaustive({
      DocumentUnversioned: () => [],
      DocumentVersioned: (doc) => Array.from(HashMap.keys(doc.versionDocuments)),
      DocumentPartiallyVersioned: (doc) => [
        ...Array.from(HashMap.keys(doc.versionDocuments)),
      ],
    }),
  )

  // Get document content based on version
  const documentContent = Match.value(document).pipe(
    Match.tagsExhaustive({
      DocumentUnversioned: (doc) => doc.document,

      DocumentPartiallyVersioned: (doc) => {
        // If a specific version is selected and available, use it
        if (selectedVersion && selectedVersion !== null) {
          const versionDocument = HashMap.get(doc.versionDocuments, selectedVersion)
          if (Option.isSome(versionDocument)) {
            return versionDocument.value
          }
        }
        // Otherwise use the default document (always present in PartiallyVersioned)
        return doc.defaultDocument
      },

      DocumentVersioned: (doc) => {
        // Fully versioned, no default fallback
        if (selectedVersion && selectedVersion !== null) {
          const versionDoc = HashMap.get(doc.versionDocuments, selectedVersion)
          if (Option.isSome(versionDoc)) {
            return versionDoc.value
          }
          // Throw if specific version requested but not found
          throw new Error(`Version ${Version.toString(selectedVersion)} not found in document`)
        }

        // Return the latest (first) version document if no specific version selected
        const firstEntry = HashMap.entries(doc.versionDocuments)[Symbol.iterator]().next()
        if (!firstEntry.done) {
          return firstEntry.value[1]
        }

        throw new Error('Versioned document has no versions')
      },
    }),
  )

  if (!documentContent) {
    throw new Error('Unable to retrieve document content')
  }

  // If no catalog provided, return just the document
  if (!schemaCatalog) {
    return { document: documentContent, availableVersions }
  }

  // Match schema catalog with document
  const schema = Match.value(schemaCatalog).pipe(
    Match.tagsExhaustive({
      CatalogUnversioned: (catalog) => {
        // For unversioned catalog with versioned document, this is a mismatch
        if (document._tag === 'DocumentVersioned') {
          throw new Error('Cannot use unversioned catalog with fully versioned document')
        }
        return catalog.schema.definition
      },

      CatalogVersioned: (catalog) => {
        // For versioned catalog with unversioned document, use latest schema
        if (document._tag === 'DocumentUnversioned') {
          const latestSchema = catalog.entries[0]?.definition
          if (!latestSchema) {
            throw new Error('Versioned catalog has no entries')
          }
          return latestSchema
        }

        // For versioned catalog with versioned/partially versioned document
        const effectiveVersion = selectedVersion && selectedVersion !== null
          ? selectedVersion
          : null

        if (!effectiveVersion) {
          // Use latest schema
          const latestSchema = catalog.entries[0]?.definition
          if (!latestSchema) {
            throw new Error('Versioned catalog has no entries')
          }
          return latestSchema
        }

        // Find matching schema for the version
        const matchingEntry = catalog.entries.find(entry => Version.equivalence(entry.version, effectiveVersion))

        if (!matchingEntry) {
          // Check if document has this version
          if (document._tag === 'DocumentVersioned') {
            const hasVersion = Option.isSome(HashMap.get(document.versionDocuments, effectiveVersion))
            if (hasVersion) {
              throw new Error(`Version ${Version.toString(effectiveVersion)} exists in document but not in catalog`)
            }
          } else if (document._tag === 'DocumentPartiallyVersioned') {
            const hasVersion = Option.isSome(HashMap.get(document.versionDocuments, effectiveVersion))
            // For partially versioned, it's ok if version doesn't exist (falls back to defaultDocument)
            if (hasVersion) {
              throw new Error(`Version ${Version.toString(effectiveVersion)} exists in document but not in catalog`)
            }
          }
          throw new Error(`Version ${Version.toString(effectiveVersion)} not found in catalog`)
        }

        return matchingEntry.definition
      },
    }),
  )

  return { document: documentContent, schema, availableVersions }
}
