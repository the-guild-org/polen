import { S } from '#lib/kit-temp/effect'
import { Order, ParseResult } from 'effect'
import { type DocumentNode, GraphQLSchema } from 'graphql'
import { buildASTSchema, parse, printSchema } from 'graphql'

// ============================================================================
// Special
// ============================================================================

const graphqlAst = S.declare(
  (input: unknown): input is DocumentNode =>
    typeof input === 'object'
    && input !== null
    && 'kind' in input
    && (input as any).kind === 'Document',
  {
    identifier: 'GraphQLDocumentNode',
    title: 'GraphQL AST',
    description: 'GraphQL Abstract Syntax Tree',
  },
)

// ============================================================================
// Schema
// ============================================================================

export const SchemaDefinition = S.transformOrFail(
  graphqlAst,
  S.instanceOf(GraphQLSchema),
  {
    strict: true,
    decode: (ast, options, astSchema) => {
      try {
        const schema = buildASTSchema(ast)
        return ParseResult.succeed(schema)
      } catch (error) {
        return ParseResult.fail(
          new ParseResult.Type(astSchema, ast, `Invalid GraphQL AST: ${error}`),
        )
      }
    },
    encode: (schema, options, astSchema) => {
      try {
        const sdl = printSchema(schema)
        const ast = parse(sdl)
        return ParseResult.succeed(ast)
      } catch (error) {
        return ParseResult.fail(
          new ParseResult.Type(astSchema, schema, `Failed to serialize schema: ${error}`),
        )
      }
    },
  },
).annotations({
  identifier: 'SchemaDefinition',
  title: 'Schema Definition',
  description: 'A GraphQL schema definition',
  equivalence: () => (a, b) => printSchema(a) === printSchema(b),
})

// ============================================================================
// Types
// ============================================================================

export type SchemaDefinition = S.Schema.Type<typeof SchemaDefinition>
export type Encoded = S.Schema.Encoded<typeof SchemaDefinition>

// ============================================================================
// SDL Codec
// ============================================================================

// Create a transformation from SDL string to AST
const sdlToAst = S.transformOrFail(
  S.String,
  graphqlAst,
  {
    strict: true,
    decode: (sdl, _, astSchema) => {
      try {
        const ast = parse(sdl)
        return ParseResult.succeed(ast)
      } catch (error) {
        return ParseResult.fail(
          new ParseResult.Type(astSchema, sdl, `Invalid SDL syntax: ${error}`),
        )
      }
    },
    encode: (ast) => ParseResult.succeed(printSchema(buildASTSchema(ast))),
  },
)

// Compose the transformations: String -> AST -> GraphQLSchema
const sdlSchema = S.compose(sdlToAst, SchemaDefinition).annotations({
  identifier: 'SDLSchema',
  title: 'SDL Schema',
  description: 'SDL string representation of a GraphQL schema',
})

// Export SDL codec
export const sdl = {
  decode: S.decodeSync(sdlSchema),
  encode: S.encodeSync(sdlSchema),
}

// ============================================================================
// Guards
// ============================================================================

export const is = S.is(SchemaDefinition)

// ============================================================================
// Codecs
// ============================================================================

export const decode = S.decode(SchemaDefinition)
export const encode = S.encode(SchemaDefinition)

// ============================================================================
// State Predicates
// ============================================================================

export const isEmpty = (schema: SchemaDefinition): boolean => {
  const sdlString = sdl.encode(schema)
  return sdlString === '' || sdlString === 'type Query'
}

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(SchemaDefinition)
