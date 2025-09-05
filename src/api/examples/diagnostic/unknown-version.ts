import { Diagnostic } from '#lib/diagnostic/$'
import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'

export const DiagnosticUnknownVersion = Diagnostic.create({
  source: 'examples-scanner',
  name: 'unknown-version',
  severity: 'error',
  context: {
    example: S.Struct({
      name: S.String,
      path: S.String,
    }),
    version: Version.Version,
    availableVersions: S.Array(Version.Version),
  },
}).annotations({
  identifier: 'DiagnosticUnknownVersion',
  description: 'Example specifies a version that does not exist in the API',
})

export const makeDiagnosticUnknownVersion = Diagnostic.createMake(DiagnosticUnknownVersion)

export type DiagnosticUnknownVersion = S.Schema.Type<typeof DiagnosticUnknownVersion>
