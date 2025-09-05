import { Diagnostic } from '#lib/diagnostic/$'
import { S } from '#lib/kit-temp/effect'

export const DiagnosticUnusedDefault = Diagnostic.create({
  source: 'examples-scanner',
  name: 'unused-default',
  severity: 'warning',
  context: {
    example: S.Struct({
      name: S.String,
      path: S.String,
    }),
    versions: S.Array(S.String),
  },
}).annotations({
  identifier: 'DiagnosticUnusedDefault',
  description: 'Default example file that is never used because explicit versions exist for all schema versions',
})

export const makeDiagnosticUnusedDefault = Diagnostic.createMake(DiagnosticUnusedDefault)

export type DiagnosticUnusedDefault = S.Schema.Type<typeof DiagnosticUnusedDefault>
