import { Diagnostic } from '#lib/diagnostic/$'
import { GraphQLError } from '#lib/graphql-error/$'
import { S } from '#lib/kit-temp/effect'

export const DiagnosticValidationError = Diagnostic.create({
  source: 'examples-validation',
  name: 'invalid-graphql',
  severity: 'error', // Will be overridden based on config
  context: {
    example: S.Struct({
      name: S.String,
      path: S.String,
    }),
    version: S.String,
    errors: S.Array(GraphQLError.GraphQLError),
  },
}).annotations({
  identifier: 'DiagnosticValidationError',
  description: 'GraphQL document validation error against the schema',
})

export const makeDiagnosticValidationError = Diagnostic.createMake(DiagnosticValidationError)

export type DiagnosticValidationError = S.Schema.Type<typeof DiagnosticValidationError>
