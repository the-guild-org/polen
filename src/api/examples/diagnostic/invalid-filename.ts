import { Diagnostic } from '#lib/diagnostic/$'
import { S } from '#lib/kit-temp/effect'

export const DiagnosticInvalidFilename = Diagnostic.create({
  source: 'examples-scanner',
  name: 'invalid-filename',
  severity: 'error',
  context: {
    file: S.String,
    reason: S.String,
  },
}).annotations({
  identifier: 'DiagnosticInvalidFilename',
  description: 'Example file has an invalid filename pattern',
})

export const makeDiagnosticInvalidFilename = Diagnostic.createMake(DiagnosticInvalidFilename)

export type DiagnosticInvalidFilename = S.Schema.Type<typeof DiagnosticInvalidFilename>