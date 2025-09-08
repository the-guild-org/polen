import { Catalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { VersionCoverage } from '#lib/version-coverage'
import { Either, Option } from 'effect'
import * as React from 'react'
import { templateConfig } from 'virtual:polen/project/config'
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
    Option.getOrNull(Catalog.getLatestVersion(schemaCatalog)),
  )
  const selectedVersionCoverage = isControlled ? controlledVersionCoverage : internalVersionCoverage
  const internalOnVersionChange = (version: VersionCoverage.VersionCoverage) => {
    if (!isControlled) {
      setInternalVersionCoverage(version)
    }
    onVersionCoverageChange?.(version)
  }

  /// ━ DATA RESOLUTION
  const result = Document.resolveDocumentAndSchema(document, schemaCatalog, selectedVersionCoverage)

  // Handle resolution errors gracefully
  if (Either.isLeft(result)) {
    console.error('Failed to resolve document and schema:', result.left.message)
    return null
  }

  const { schema, content } = result.right
  const highlightedCode = useHighlighted(content, { interactive: true })

  if (!highlightedCode) {
    return null
  }

  return (
    <GraphQLInteractive
      codeblock={highlightedCode}
      schema={schema?.definition}
      referenceEnabled={templateConfig.reference.enabled}
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
