import { Catalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { VersionCoverage } from '#lib/version-coverage'
import { Option } from 'effect'
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
  const {
    schema,
    content,
  } = Document.resolveDocumentAndSchema(document, schemaCatalog, selectedVersionCoverage)

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
