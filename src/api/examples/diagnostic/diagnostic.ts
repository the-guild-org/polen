import { DiagnosticDuplicateContent } from '#api/examples/diagnostic/duplicate-content'
import { DiagnosticInvalidFilename } from '#api/examples/diagnostic/invalid-filename'
import { DiagnosticMissingVersions } from '#api/examples/diagnostic/missing-versions'
import { DiagnosticUnknownVersion } from '#api/examples/diagnostic/unknown-version'
import { DiagnosticValidationError } from '#api/examples/diagnostic/validation-error'
import { S } from '#lib/kit-temp/effect'

// Re-export all individual diagnostics
export * from './duplicate-content.js'
export * from './invalid-filename.js'
export * from './missing-versions.js'
export * from './unknown-version.js'
export * from './validation-error.js'
export { validateExamples } from './validator.js'

export const Diagnostic = S.Union(
  DiagnosticDuplicateContent,
  DiagnosticMissingVersions,
  DiagnosticInvalidFilename,
  DiagnosticUnknownVersion,
  DiagnosticValidationError,
).annotations({
  identifier: 'ExamplesDiagnostic',
  description: 'All diagnostics that can be generated for examples',
})

export type Diagnostic = S.Schema.Type<typeof Diagnostic>
