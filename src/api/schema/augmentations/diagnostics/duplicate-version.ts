import { S } from '#dep/effect'
import { Diagnostic } from '#lib/diagnostic/$'
import { Sch } from '@wollybeard/kit'
Sch

export const DiagnosticDuplicateVersion = Diagnostic.create({
  source: 'schema-augmentations',
  name: 'duplicate-version',
  severity: 'error',
  context: {
    version: S.String,
    firstPath: S.String,
    duplicatePath: S.String,
  },
}).annotations({
  identifier: 'DiagnosticDuplicateVersion',
  description: 'Same version is specified multiple times in augmentation configuration',
})

export const makeDiagnosticDuplicateVersion = Diagnostic.createMake(DiagnosticDuplicateVersion)

export type DiagnosticDuplicateVersion = typeof DiagnosticDuplicateVersion.Type
