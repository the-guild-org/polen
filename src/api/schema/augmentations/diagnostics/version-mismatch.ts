import { Diagnostic } from '#lib/diagnostic/$'
import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'

export const DiagnosticVersionMismatch = Diagnostic.create({
  source: 'schema-augmentations',
  name: 'version-mismatch',
  severity: 'error',
  context: {
    path: S.String,
    requestedVersion: Version.Version,
    availableVersions: S.Array(S.String),
  },
}).annotations({
  identifier: 'DiagnosticVersionMismatch',
  description: 'Augmentation specifies a version that does not match any schema version',
})

export const makeDiagnosticVersionMismatch = Diagnostic.createMake(DiagnosticVersionMismatch)

export type DiagnosticVersionMismatch = S.Schema.Type<typeof DiagnosticVersionMismatch>
