import { Catalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { S } from '#lib/kit-temp/$'
import type { Schema } from '#lib/schema/$'
import { VersionCoverage } from '#lib/version-selection/$'
import { VersionCoverageSet } from '#lib/version-selection/version-selection'
import { Version } from '#lib/version/$'
import { Array, HashMap, Match } from 'effect'
import type { GraphQLSchema } from 'graphql'
import * as React from 'react'
import { useHighlighted } from '../hooks/use-highlighted.js'
import { GraphQLInteractive } from './GraphQLInteractive/GraphQLInteractive.js'
import { VersionCoveragePicker } from './VersionCoveragePicker.js'

interface GraphQLDocumentProps {
  /** The document containing the GraphQL content */
  document: Document.Document

  /** Optional GraphQL schema catalog for validation and interactivity */
  schemaCatalog?: Catalog.Catalog | undefined

  /** Whether to show version picker for versioned examples */
  showVersionCoveragePicker?: boolean | undefined

  /** Callback when version changes */
  onVersionCoverageChange?: (versionCoverage: VersionCoverage.VersionCoverage) => void

  /** Override the initial/selected version */
  selectedVersionCoverage?: VersionCoverage.VersionCoverage | undefined

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
  showVersionCoveragePicker = true,
  onVersionCoverageChange,
  selectedVersionCoverage: controlledVersionCoverage,
  style,
}) => {
  /// ━ VERSION MANAGEMENT
  const isControlled = controlledVersionCoverage !== undefined
  const [internalVersionCoverage, setInternalVersionCoverage] = React.useState<VersionCoverage.VersionCoverage | null>(
    Catalog.getLatestVersionIdentifier(schemaCatalog),
  )
  const selectedVersionCoverage = isControlled ? controlledVersionCoverage : internalVersionCoverage
  const internalOnVersionChange = (version: VersionCoverage.VersionCoverage) => {
    if (!isControlled) {
      setInternalVersionCoverage(version)
    }
    onVersionCoverageChange?.(version)
  }

  /// ━ DATA RESOLUTION
  const {
    schema,
    content,
  } = resolveSelectedVerCov(document, selectedVersionCoverage, schemaCatalog)

  const highlightedCode = useHighlighted(content, { interactive: true })

  if (!highlightedCode) {
    return null
  }

  return (
    <GraphQLInteractive
      codeblock={highlightedCode}
      schema={schema?.definition}
      style={style}
      toolbar={() => (
        showVersionCoveragePicker && selectedVersionCoverage && (
          <VersionCoveragePicker
            document={document}
            schemaCatalog={schemaCatalog!}
            current={selectedVersionCoverage}
            onChange={internalOnVersionChange}
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
 * @param selectedVersionCoverage - The version to select (optional, defaults to latest)
 * @param schemaCatalog - The schema catalog to match against (optional)
 * @returns Object with document content, optional schema, and available versions
 * @throws {Error} If versions in catalog don't match versions in document
 */
type Result = { content: string; schema?: Schema.Schema }
const resolveSelectedVerCov = (
  document: Document.Document,
  selectedVersionCoverage?: VersionCoverage.VersionCoverage | null,
  schemaCatalog?: Catalog.Catalog,
): Result => {
  if (Document.Unversioned.is(document)) {
    return {
      content: document.document,
      schema: Match.value(schemaCatalog).pipe(
        Match.tagsExhaustive({
          CatalogUnversioned: (catalog) => catalog.schema,
          CatalogVersioned: (catalog) => Catalog.Versioned.getLatest(catalog),
        }),
      ),
    }
  }

  return Match.value(selectedVersionCoverage).pipe(
    Match.whenOr(null, undefined, _ => {
      const content = Document.Versioned.getContentForLatestVersionOrThrow(document)
      return { content }
    }),
    Match.orElse(_ => {
      const version = VersionCoverage.getLatest(_)

      const content = Document.Versioned.getContentForVersion(document, version)
      if (!content) {
        throw new Error(`Version ${Version.encodeSync(version)} not covered by document`)
      }

      if (!schemaCatalog) return { version, content }

      if (Catalog.Unversioned.is(schemaCatalog)) {
        throw new Error('Cannot use a set of versions with an unversioned catalog')
      }
      const schema = schemaCatalog.entries.find(e => Version.equivalence(e.version, version))
      if (!schema) {
        throw new Error(`Version ${Version.encodeSync(version)} not found in catalog`)
      }

      return { content, schema: schema }
    }),
  )
}
