import { Cause, Effect, Exit, Option } from 'effect'
import { expect, test } from 'vitest'
import { Grafaid } from './$.js'

test('parseSchema - parses valid GraphQL schema SDL', () => {
  const sdl = `type Query { hello: String }`
  const result = Effect.runSync(Grafaid.Parse.parseSchema(sdl))
  expect(result).toBeDefined()
  expect(result.kind).toBe('Document')
  expect(result.definitions).toHaveLength(1)
})

test('parseSchema - returns ParseError for invalid schema SDL', () => {
  const invalidSdl = `type Query { hello: String missing_closing_brace`
  const result = Effect.runSyncExit(Grafaid.Parse.parseSchema(invalidSdl, { source: 'test.graphql' }))
  expect(Exit.isFailure(result)).toBe(true)

  if (Exit.isFailure(result)) {
    const error = Cause.failureOption(result.cause)
    expect(Option.isSome(error)).toBe(true)
    if (Option.isSome(error)) {
      expect(error.value).toBeInstanceOf(Grafaid.ParseError)
      expect(error.value._tag).toBe('ParseError')
      expect(error.value.parseType).toBe('schema')
      expect(error.value.source).toBe('test.graphql')
      expect(error.value.message).toContain('Failed to parse GraphQL schema')
      expect(error.value.message).toContain('test.graphql')
    }
  }
})

test('parseSchema - includes excerpt in error for parse failures', () => {
  const invalidSdl = `type Query {
  hello: String
  invalid syntax here
}`
  const result = Effect.runSyncExit(Grafaid.Parse.parseSchema(invalidSdl))
  expect(Exit.isFailure(result)).toBe(true)

  if (Exit.isFailure(result)) {
    const error = Cause.failureOption(result.cause)
    expect(Option.isSome(error)).toBe(true)
    if (Option.isSome(error)) {
      expect(error.value.excerpt).toBeDefined()
      expect(error.value.excerpt).toContain('Line')
    }
  }
})

test('parseDocument - parses valid GraphQL query document', () => {
  const query = `query GetUser { user { id name } }`
  const result = Effect.runSync(Grafaid.Parse.parseDocument(query))
  expect(result).toBeDefined()
  expect(result.kind).toBe('Document')
  expect(result.definitions).toHaveLength(1)
  expect(result.definitions[0]?.kind).toBe('OperationDefinition')
})

test('parseDocument - parses anonymous query', () => {
  const query = `{ user { id name } }`
  const result = Effect.runSync(Grafaid.Parse.parseDocument(query))
  expect(result).toBeDefined()
  expect(result.kind).toBe('Document')
  expect(result.definitions).toHaveLength(1)
})

test('parseDocument - returns ParseError for invalid query document', () => {
  const invalidQuery = `query GetUser { user { id name // invalid comment syntax } }`
  const result = Effect.runSyncExit(Grafaid.Parse.parseDocument(invalidQuery, { source: 'getUserQuery' }))
  expect(Exit.isFailure(result)).toBe(true)

  if (Exit.isFailure(result)) {
    const error = Cause.failureOption(result.cause)
    expect(Option.isSome(error)).toBe(true)
    if (Option.isSome(error)) {
      expect(error.value).toBeInstanceOf(Grafaid.ParseError)
      expect(error.value._tag).toBe('ParseError')
      expect(error.value.parseType).toBe('document')
      expect(error.value.source).toBe('getUserQuery')
      expect(error.value.message).toContain('Failed to parse GraphQL document')
    }
  }
})

test('parse - auto-detects schema type', () => {
  const sdl = `type Query { hello: String }`
  const result = Effect.runSyncExit(Grafaid.Parse.parse(sdl))
  expect(Exit.isSuccess(result)).toBe(true)

  // Check error for parseType inference
  const invalidSdl = `type Query { invalid`
  const errorResult = Effect.runSyncExit(Grafaid.Parse.parse(invalidSdl))

  if (Exit.isFailure(errorResult)) {
    const error = Cause.failureOption(errorResult.cause)
    if (Option.isSome(error)) {
      expect(error.value.parseType).toBe('schema')
    }
  }
})

test('parse - auto-detects document type for query', () => {
  const query = `query GetUser { user { id } }`
  const result = Effect.runSyncExit(Grafaid.Parse.parse(query))
  expect(Exit.isSuccess(result)).toBe(true)

  // Check error for parseType inference
  const invalidQuery = `query GetUser { invalid`
  const errorResult = Effect.runSyncExit(Grafaid.Parse.parse(invalidQuery))

  if (Exit.isFailure(errorResult)) {
    const error = Cause.failureOption(errorResult.cause)
    if (Option.isSome(error)) {
      expect(error.value.parseType).toBe('document')
    }
  }
})

test('parse - auto-detects document type for anonymous query', () => {
  const query = `{ user { id } }`
  const result = Effect.runSyncExit(Grafaid.Parse.parse(query))
  expect(Exit.isSuccess(result)).toBe(true)

  // Check error for parseType inference
  const invalidQuery = `{ invalid`
  const errorResult = Effect.runSyncExit(Grafaid.Parse.parse(invalidQuery))

  if (Exit.isFailure(errorResult)) {
    const error = Cause.failureOption(errorResult.cause)
    if (Option.isSome(error)) {
      expect(error.value.parseType).toBe('document')
    }
  }
})

test('parse - returns unknown type when unable to infer', () => {
  const ambiguous = `something that is not clearly schema or document`
  const errorResult = Effect.runSyncExit(Grafaid.Parse.parse(ambiguous))

  if (Exit.isFailure(errorResult)) {
    const error = Cause.failureOption(errorResult.cause)
    if (Option.isSome(error)) {
      expect(error.value.parseType).toBe('unknown')
    }
  }
})

test.for([
  { input: 'type Query { field: String }', expectedType: 'schema' },
  { input: 'interface Node { id: ID! }', expectedType: 'schema' },
  { input: 'enum Status { ACTIVE }', expectedType: 'schema' },
  { input: 'scalar Date', expectedType: 'schema' },
  { input: 'union Result = Success | Error', expectedType: 'schema' },
  { input: 'input Filter { name: String }', expectedType: 'schema' },
  { input: 'schema { query: Query }', expectedType: 'schema' },
  { input: 'extend type Query { extra: String }', expectedType: 'schema' },
  { input: 'directive @custom on FIELD', expectedType: 'schema' },
  { input: 'query GetData { field }', expectedType: 'document' },
  { input: 'mutation UpdateData { field }', expectedType: 'document' },
  { input: 'subscription OnData { field }', expectedType: 'document' },
  { input: 'fragment UserFields on User { id }', expectedType: 'document' },
  { input: '{ field }', expectedType: 'document' },
  { input: 'random text', expectedType: 'unknown' },
])('parse - infers parseType "$expectedType" for "$input"', ({ input, expectedType }) => {
  const errorResult = Effect.runSyncExit(Grafaid.Parse.parse(input))

  // These will all fail to parse, but we're testing the type inference
  if (Exit.isFailure(errorResult)) {
    const error = Cause.failureOption(errorResult.cause)
    expect(Option.isSome(error)).toBe(true)
    if (Option.isSome(error)) {
      expect(error.value.parseType).toBe(expectedType)
    }
  }
})
