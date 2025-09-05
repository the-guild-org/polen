import { applyControl, type Control } from './control.js'
import type { Diagnostic } from './diagnostic.js'
import { report } from './reporter.js'

/**
 * Filters diagnostics based on control settings and reports them.
 *
 * @param diagnostics - Array of diagnostics to filter
 * @param getControl - Function to get the control setting for a diagnostic
 * @param phase - Current phase (dev or build)
 */
export const filterAndReport = <T extends Diagnostic>(
  diagnostics: T[],
  getControl: (diagnostic: T) => Control | boolean | undefined,
  phase: 'dev' | 'build' = 'dev',
): void => {
  const filteredDiagnostics = applyControl(diagnostics, getControl, phase)
  if (filteredDiagnostics.length > 0) {
    report(filteredDiagnostics)
  }
}
