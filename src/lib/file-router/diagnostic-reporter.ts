import type { Diagnostic } from './linter.ts'

export const reportDiagnostics = (diagnostics: Diagnostic[]) => {
  if (diagnostics.length === 0) return
  
  const errors = diagnostics.filter(d => d.severity === 'error')
  const warnings = diagnostics.filter(d => d.severity === 'warning')
  const infos = diagnostics.filter(d => d.severity === 'info')
  
  const summary = [
    errors.length > 0 && `${errors.length} error${errors.length === 1 ? '' : 's'}`,
    warnings.length > 0 && `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`,
    infos.length > 0 && `${infos.length} info${infos.length === 1 ? '' : 's'}`,
  ].filter(Boolean).join(', ')
  
  console.warn(`\n🔍 Polen found ${summary}:\n`)
  
  diagnostics.forEach((diagnostic, index) => {
    const icon = diagnostic.severity === 'error' ? '❌' : diagnostic.severity === 'warning' ? '⚠️ ' : 'ℹ️ '
    console.warn(`${icon} ${index + 1}. ${diagnostic.message}\n`)
  })
}