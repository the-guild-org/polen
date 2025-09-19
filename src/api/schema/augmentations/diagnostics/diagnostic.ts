import { DiagnosticDuplicateVersion } from '#api/schema/augmentations/diagnostics/duplicate-version'
import { DiagnosticInvalidPath } from '#api/schema/augmentations/diagnostics/invalid-path'
import { DiagnosticVersionMismatch } from '#api/schema/augmentations/diagnostics/version-mismatch'
import { S } from '#dep/effect'

// Re-export all individual diagnostics
export * from './duplicate-version.js'
export * from './invalid-path.js'
export * from './version-mismatch.js'

export const Diagnostic = S.Union(
  DiagnosticInvalidPath,
  DiagnosticVersionMismatch,
  DiagnosticDuplicateVersion,
).annotations({
  identifier: 'AugmentationsDiagnostic',
  description: 'All diagnostics that can be generated for schema augmentations',
})

export type Diagnostic = S.Schema.Type<typeof Diagnostic>
