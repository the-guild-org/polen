import { S } from '#dep/effect'
import { Diagnostic } from '#lib/diagnostic/$'
import { Sch } from '@wollybeard/kit'
import { Version } from 'graphql-kit'
Sch

export const DiagnosticMissingVersions = Diagnostic.create({
  source: 'examples-scanner',
  name: 'missing-versions',
  severity: 'info',
  context: {
    example: S.Struct({
      name: S.String,
      path: S.String,
    }),
    providedVersions: S.Array(Version.Version),
    missingVersions: S.Array(Version.Version),
  },
}).annotations({
  identifier: 'DiagnosticMissingVersions',
  description: 'Example does not have explicit versions for all schema versions',
})

export const makeDiagnosticMissingVersions = Diagnostic.createMake(DiagnosticMissingVersions)

export type DiagnosticMissingVersions = typeof DiagnosticMissingVersions.Type
