import { Diagnostic } from '#lib/diagnostic/$'
import { S } from '#lib/kit-temp/effect'

export const DiagnosticDuplicateContent = Diagnostic.create({
  source: 'examples-scanner',
  name: 'duplicate-content',
  severity: 'info',
  context: {
    example: S.Struct({
      name: S.String,
      path: S.String,
    }),
    duplicates: S.Array(S.Struct({
      version1: S.String,
      version2: S.String,
    })),
  },
}).annotations({
  identifier: 'DiagnosticDuplicateContent',
  description: 'Multiple versions of an example have identical content',
})

export const makeDiagnosticDuplicateContent = Diagnostic.createMake(DiagnosticDuplicateContent)

export type DiagnosticDuplicateContent = S.Schema.Type<typeof DiagnosticDuplicateContent>
