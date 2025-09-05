import { Diagnostic } from '#lib/diagnostic/$'
import { S } from '#lib/kit-temp/effect'

export const DiagnosticMissingVersions = Diagnostic.create({
  source: 'examples-scanner',
  name: 'missing-versions',
  severity: 'info',
  context: {
    example: S.Struct({
      name: S.String,
      path: S.String,
    }),
    providedVersions: S.Array(S.String),
    missingVersions: S.Array(S.String),
  },
}).annotations({
  identifier: 'DiagnosticMissingVersions',
  description: 'Example does not have explicit versions for all schema versions',
})

export const makeDiagnosticMissingVersions = Diagnostic.createMake(DiagnosticMissingVersions)

export type DiagnosticMissingVersions = S.Schema.Type<typeof DiagnosticMissingVersions>
