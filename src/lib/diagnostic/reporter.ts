import { Group } from '@wollybeard/kit'
import type { DiagnosticBase } from './diagnostic.js'
import { Severity } from './severity.js'

// ============================================================================
// Helpers
// ============================================================================

const getIcon = (severity: DiagnosticBase['severity']): string => {
  switch (severity) {
    case Severity.enums.error:
      return '✗'
    case Severity.enums.warning:
      return '⚠'
    case Severity.enums.info:
      return 'ⓘ'
  }
}

const formatSummary = (diagnostics: DiagnosticBase[]): string => {
  const errors = diagnostics.filter(d => d.severity === Severity.enums.error)
  const warnings = diagnostics.filter(d => d.severity === Severity.enums.warning)
  const infos = diagnostics.filter(d => d.severity === Severity.enums.info)

  const parts = [
    errors.length > 0 && `${errors.length} error${errors.length === 1 ? '' : 's'}`,
    warnings.length > 0 && `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`,
    infos.length > 0 && `${infos.length} info${infos.length === 1 ? '' : 's'}`,
  ].filter(Boolean)

  return parts.join(', ')
}

// ============================================================================
// Reporter
// ============================================================================

/**
 * Reports diagnostics to the console, grouped by source.
 *
 * This is a generic reporter that works with any diagnostic
 * that extends DiagnosticBase. It groups diagnostics by their
 * source field and displays them with appropriate icons and
 * formatting.
 *
 * @param diagnostics - Array of diagnostics to report
 *
 * @example
 * ```typescript
 * const diagnostics = [
 *   { type: 'missing-file', severity: 'error', message: 'File not found', source: 'file-router' },
 *   { type: 'unused-default', severity: 'warning', message: 'Default never used', source: 'examples' }
 * ]
 * report(diagnostics)
 * ```
 */
export const report = (diagnostics: DiagnosticBase[]): void => {
  if (diagnostics.length === 0) return

  // Group diagnostics by source using kit's Group.by
  const bySource = Group.by(diagnostics, 'source')

  // Report each source's diagnostics
  for (const [source, sourceDiagnostics] of Object.entries(bySource)) {
    if (!sourceDiagnostics) continue
    const summary = formatSummary(sourceDiagnostics)
    console.warn(`\n${source} found ${summary}:\n`)

    sourceDiagnostics.forEach((diagnostic, index) => {
      const icon = getIcon(diagnostic.severity)
      console.warn(`${icon} ${index + 1}. ${diagnostic.message}\n`)
    })
  }
}
