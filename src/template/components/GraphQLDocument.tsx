import { Catalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { Version } from '#lib/version/$'
import { Box } from '@radix-ui/themes'
import { HashMap, Match, Option } from 'effect'
import type { GraphQLSchema } from 'graphql'
import * as React from 'react'
import { useHighlighted } from '../hooks/use-highlighted.js'
import { ExampleVersionPicker } from './ExampleVersionPicker.js'
import { GraphQLInteractive } from './GraphQLInteractive/GraphQLInteractive.js'

interface GraphQLDocumentProps {
  /** The document containing the GraphQL content */
  document: Document.Document

  /** Optional GraphQL schema catalog for validation and interactivity */
  schemaCatalog?: Catalog.Catalog | undefined

  /** Whether to show version picker for versioned examples */
  showVersionPicker?: boolean | undefined

  /** Callback when version changes */
  onVersionChange?: (version: Version.Version) => void

  /** Override the initial/selected version */
  selectedVersion?: Version.Version | undefined

  /** Optional custom styles */
  style?: React.CSSProperties | undefined
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
        showVersionPicker && (
          <ExampleVersionPicker
            document={document}
            schemaCatalog={schemaCatalog!}
            selectedVersion={selectedVersion}
            onVersionChange={internalOnVersionChange}
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
      DocumentVersioned: (doc) => Document.Versioned.getAllVersions(doc),
    }),
  )

  // Get document content based on version
  const documentContent = Match.value(document).pipe(
    Match.tagsExhaustive({
      DocumentUnversioned: (doc) => doc.document,

      DocumentVersioned: (doc) => {
        if (!selectedVersion) {
          // Use first available version if none selected
          const firstVersion = availableVersions[0]
          if (!firstVersion) throw new Error('No versions available')
          const content = Document.Versioned.getDocumentForVersion(doc, firstVersion)
          if (!content) throw new Error(`No document for version ${Version.encodeSync(firstVersion)}`)
          return content
        }

        const content = Document.Versioned.getDocumentForVersion(doc, selectedVersion)
        if (!content) {
          throw new Error(`No document for version ${Version.encodeSync(selectedVersion)}`)
        }
        return content
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

        // For versioned catalog with versioned document
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
            const hasDocument = Document.Versioned.getDocumentForVersion(document, effectiveVersion)
            if (hasDocument) {
              throw new Error(`Version ${Version.encodeSync(effectiveVersion)} exists in document but not in catalog`)
            }
          }
          throw new Error(`Version ${Version.encodeSync(effectiveVersion)} not found in catalog`)
        }

        return matchingEntry.definition
      },
    }),
  )

  return { document: documentContent, schema, availableVersions }
}
