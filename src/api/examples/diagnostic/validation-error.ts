import { Diagnostic } from '#lib/diagnostic/$'
import { S } from '#lib/kit-temp/effect'
import { Version } from '#lib/version/$'

export const DiagnosticValidationError = Diagnostic.create({
  source: 'examples-validation',
  name: 'invalid-graphql',
  severity: 'error', // Will be overridden based on config
  context: {
    example: S.Struct({
      name: S.String,
      path: S.String,
    }),
    version: S.optional(Version.Version),
    errors: S.Array(S.Struct({
      message: S.String,
      locations: S.optional(S.Array(S.Struct({
        line: S.Number,
        column: S.Number,
      }))),
    })),
  },
}).annotations({
  identifier: 'DiagnosticValidationError',
  description: 'GraphQL document validation error against the schema',
})

export const makeDiagnosticValidationError = Diagnostic.createMake(DiagnosticValidationError)

export type DiagnosticValidationError = S.Schema.Type<typeof DiagnosticValidationError>
