import { Diagnostic } from '#lib/diagnostic/$'
import { S } from 'graphql-kit'
import { Version } from 'graphql-kit'

export const DiagnosticInvalidPath = Diagnostic.create({
  source: 'schema-augmentations',
  name: 'invalid-path',
  severity: 'error',
  context: {
    path: S.String,
    version: S.optional(S.Union(Version.Version, S.Null)),
    error: S.String,
  },
}).annotations({
  identifier: 'DiagnosticInvalidPath',
  description: 'Augmentation references a non-existent type or field in the schema',
})

export const makeDiagnosticInvalidPath = Diagnostic.createMake(DiagnosticInvalidPath)

export type DiagnosticInvalidPath = S.Schema.Type<typeof DiagnosticInvalidPath>
