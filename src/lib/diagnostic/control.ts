import { S } from 'graphql-kit'
import type { Diagnostic } from './diagnostic.js'
import { Severity } from './severity.js'

// ============================================================================
// Schema
// ============================================================================

/**
 * Phase-specific control for diagnostics.
 */
const PhaseControl = S.Struct({
  /**
   * Whether diagnostics are enabled for this phase.
   * If not specified, uses the global enabled setting.
   */
  enabled: S.optional(S.Boolean),
  /**
   * Override the default severity for this phase.
   * If not specified, the diagnostic's default severity is used.
   */
  severity: S.optional(Severity),
}).annotations({
  identifier: 'DiagnosticPhaseControl',
  description: 'Control diagnostic behavior for a specific phase',
})

/**
 * Fine-grained control over diagnostic behavior.
 * Can be used as a boolean for simple on/off, or as an object for detailed control.
 */
export const Control = S.Struct({
  /**
   * Master switch - if false, diagnostic is disabled in all phases.
   */
  enabled: S.Boolean,
  /**
   * Control behavior during development.
   */
  dev: S.optional(PhaseControl),
  /**
   * Control behavior during build.
   */
  build: S.optional(PhaseControl),
}).annotations({
  identifier: 'DiagnosticControl',
  description: 'Fine-grained control over diagnostic behavior',
})

export type Control = typeof Control.Type

// ============================================================================
// Helpers
// ============================================================================

/**
 * Filters diagnostics based on control settings and adjusts their severity.
 *
 * @param diagnostics - Array of diagnostics to filter
 * @param getControl - Function to get the control setting for a diagnostic
 * @param phase - Current phase (dev or build)
 * @returns Filtered diagnostics with adjusted severity
 */
export const applyControl = <T extends Diagnostic>(
  diagnostics: T[],
  getControl: (diagnostic: T) => Control | boolean | undefined,
  phase: Phase = 'dev',
): T[] => {
  return diagnostics.filter(diagnostic => {
    const control = getControl(diagnostic)

    // Get effective settings for this phase
    const settings = getEffetivePhaseSettings(
      control,
      phase,
      { enabled: true, severity: diagnostic.severity },
    )

    if (!settings.enabled) {
      return false // Filter out disabled diagnostics
    } // Override severity based on control settings

    ;(diagnostic as any).severity = settings.severity

    return true
  })
}

export type Phase = 'dev' | 'build'

/**
 * Get effective settings for a specific phase.
 * Call sites provide their own defaults for each diagnostic type.
 *
 * @param control - The diagnostic control configuration (boolean, object, or undefined)
 * @param phase - The current phase (dev or build)
 * @param defaults - Default settings to use when not specified
 * @returns Effective enabled state and severity for the phase
 */
export const getEffetivePhaseSettings = (
  control: Control | boolean | undefined,
  phase: Phase,
  defaults: {
    enabled: boolean
    severity: Severity
  },
): { enabled: boolean; severity: Severity } => {
  // Handle undefined - use defaults
  if (control === undefined) {
    return defaults
  }

  // Handle boolean shorthand
  if (typeof control === 'boolean') {
    return {
      enabled: control,
      severity: defaults.severity,
    }
  }

  // Handle full DiagnosticControl
  const phaseControl = control[phase]

  // Determine enabled state
  // Priority: phase.enabled > global.enabled > default.enabled
  const enabled = phaseControl?.enabled ?? control.enabled

  // If globally disabled and phase doesn't explicitly enable, stay disabled
  if (!enabled) {
    return {
      enabled: false,
      severity: phaseControl?.severity ?? defaults.severity,
    }
  }

  return {
    enabled,
    severity: phaseControl?.severity ?? defaults.severity,
  }
}
