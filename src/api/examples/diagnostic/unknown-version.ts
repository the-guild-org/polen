import { Diagnostic } from '#lib/diagnostic/$'
import { S } from '#lib/kit-temp/effect'

export const DiagnosticUnknownVersion = Diagnostic.create({
  source: 'examples-scanner',
  name: 'unknown-version',
  severity: 'error',
  context: {
    example: S.Struct({
      name: S.String,
      path: S.String,
    }),
    version: S.String,
    availableVersions: S.Array(S.String),
  },
}).annotations({
  identifier: 'DiagnosticUnknownVersion',
  description: 'Example specifies a version that does not exist in the API',
})

export const makeDiagnosticUnknownVersion = Diagnostic.createMake(DiagnosticUnknownVersion)

export type DiagnosticUnknownVersion = S.Schema.Type<typeof DiagnosticUnknownVersion>