import { S } from '#dep/effect'
import { Diagnostic } from '#lib/diagnostic/$'
import { Sch } from '@wollybeard/kit'
import { Version } from 'graphql-kit'
Sch

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

export type DiagnosticUnknownVersion = typeof DiagnosticUnknownVersion.Type
