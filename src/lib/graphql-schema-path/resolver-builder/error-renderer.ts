import { print } from '../printer-text.js'
import { getSegmentName } from './error.js'
import type { TraversalError } from './error.js'

/**
 * Rendering utilities for traversal errors.
 * Provides formatted error messages with context about where path traversal failed.
 */

// ============================================================================
// Constants
// ============================================================================

const MAX_OPTIONS_DISPLAY = 10
const ARROW = '→'
const FAILED_MARKER = '❌'

// ============================================================================
// Path Rendering
// ============================================================================

export const renderPathWithError = (error: TraversalError): string => {
  const { path, location } = error
  const parts: string[] = []

  // Build succeeded path from parent chain
  if (location.parentChain.length > 0) {
    const succeededPath = location.parentChain
      .map(node => getSegmentName(node))
      .join('')
    parts.push(succeededPath)
  }

  // Add failed segment with marker
  const failedSegment = getSegmentName(location.currentNode)
  parts.push(`${FAILED_MARKER} ${failedSegment}`)

  // Add remaining path (if we can extract it from the original path)
  // This would require parsing the path and extracting segments after position
  // For now, we'll just show the full original path for reference
  parts.push(`(from: ${print(path)})`)

  return parts.join(' ')
}

// ============================================================================
// Options Rendering
// ============================================================================

const renderAvailableOptions = (options?: readonly string[]): string => {
  if (!options || options.length === 0) {
    return ''
  }

  const displayOptions = options.slice(0, MAX_OPTIONS_DISPLAY)
  const hasMore = options.length > MAX_OPTIONS_DISPLAY

  let result = '\nAvailable options:\n'
  result += displayOptions.map(opt => `  • ${opt}`).join('\n')

  if (hasMore) {
    result += `\n  ... and ${options.length - MAX_OPTIONS_DISPLAY} more`
  }

  return result
}

// ============================================================================
// Main Error Renderer
// ============================================================================

export const renderTraversalError = (error: TraversalError): string => {
  const lines: string[] = []

  // Main error message based on cause
  const causeMessage = error.cause._tag === 'NodeNotFound'
    ? 'Node not found'
    : error.cause._tag === 'KindMismatch'
    ? 'Kind mismatch'
    : 'Traversal failed'

  lines.push(causeMessage)

  // Path context
  lines.push(`\nPath: ${renderPathWithError(error)}`)

  // Position
  lines.push(`Position: ${error.location.position}`)

  // Available options (suggestions)
  const optionsText = renderAvailableOptions(error.suggestions)
  if (optionsText) {
    lines.push(optionsText)
  }

  return lines.join('\n')
}

// ============================================================================
// Concise Renderer
// ============================================================================

/**
 * Render a concise version of the error for inline display.
 */
export const renderTraversalErrorConcise = (error: TraversalError): string => {
  // Build the path string from location
  const pathParts: string[] = []

  // Add parent chain
  if (error.location.parentChain.length > 0) {
    const parentPath = error.location.parentChain
      .map(node => getSegmentName(node))
      .join('')
    pathParts.push(parentPath)
  }

  // Add current (failed) node
  pathParts.push(getSegmentName(error.location.currentNode))
  const pathStr = pathParts.join('')

  const causeMessage = error.cause._tag === 'NodeNotFound'
    ? 'Node not found'
    : error.cause._tag === 'KindMismatch'
    ? 'Kind mismatch'
    : 'Traversal failed'

  if (error.suggestions && error.suggestions.length > 0) {
    const options = error.suggestions.slice(0, 3).join(', ')
    const hasMore = error.suggestions.length > 3

    return `${causeMessage} at "${pathStr}". Did you mean: ${options}${hasMore ? ', ...' : ''}?`
  }

  return `${causeMessage} at "${pathStr}"`
}

// ============================================================================
// Diagnostic Converter
// ============================================================================

/**
 * Convert traversal error to a diagnostic-friendly format.
 * Useful for integrating with build tools and IDEs.
 */
export const toDiagnosticMessage = (error: TraversalError): {
  message: string
  hint?: string
  position: number
  path: string
} => {
  // Build the path string from location
  const pathParts: string[] = []

  // Add parent chain
  if (error.location.parentChain.length > 0) {
    const parentPath = error.location.parentChain
      .map(node => getSegmentName(node))
      .join('')
    pathParts.push(parentPath)
  }

  // Add current (failed) node
  pathParts.push(getSegmentName(error.location.currentNode))
  const pathStr = pathParts.join('')

  let hint: string | undefined

  if (error.suggestions && error.suggestions.length > 0) {
    const options = error.suggestions.slice(0, 5)
    hint = `Available options: ${options.join(', ')}`
  }

  const causeMessage = error.cause._tag === 'NodeNotFound'
    ? 'Node not found'
    : error.cause._tag === 'KindMismatch'
    ? 'Kind mismatch'
    : 'Traversal failed'

  return {
    message: causeMessage,
    ...(hint ? { hint } : {}),
    position: error.location.position,
    path: pathStr,
  }
}
