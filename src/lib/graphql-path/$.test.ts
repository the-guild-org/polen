import { S } from '#lib/kit-temp/effect'
import { describe, expect, test } from 'vitest'
import { GraphQLPath } from './$.js'

describe('decode', () => {
  test.for([
    ['User', [{ _tag: 'TypeSegment', type: 'User' }]],
    ['User.name', [
      { _tag: 'TypeSegment', type: 'User' },
      { _tag: 'FieldSegment', field: 'name' },
    ]],
    ['User.posts(limit)', [
      { _tag: 'TypeSegment', type: 'User' },
      { _tag: 'FieldSegment', field: 'posts' },
      { _tag: 'ArgumentSegment', argument: 'limit' },
    ]],
  ])('decodes "%s"', ([input, expected]) => {
    expect(GraphQLPath.Definition.decode(input)).toEqual(expected)
  })

  test.for([
    '',
    'Type.field.extra',
    'Type(arg)',
    '.field',
    'Type.',
  ])('throws on invalid format "%s"', (input) => {
    expect(() => GraphQLPath.Definition.decode(input)).toThrow()
  })
})

describe('encode', () => {
  test.for(
    [
      [GraphQLPath.Definition.type('User'), 'User'],
      [GraphQLPath.Definition.field('User', 'name'), 'User.name'],
      [GraphQLPath.Definition.argument('User', 'posts', 'limit'), 'User.posts(limit)'],
    ] as const,
  )('encodes path to "%s"', ([path, expected]) => {
    expect(GraphQLPath.Definition.encode(path as any)).toBe(expected)
  })
})

describe('round-trip', () => {
  test.for([
    'Query',
    'Mutation',
    'User',
    'User.id',
    'User.name',
    'Query.users',
    'User.posts(limit)',
    'Query.search(query)',
    'Mutation.createUser(input)',
  ])('round-trips "%s"', (pathString) => {
    const decoded = GraphQLPath.Definition.decode(pathString)
    const encoded = GraphQLPath.Definition.encode(decoded)
    expect(encoded).toBe(pathString)
  })
})

describe('type guards', () => {
  const typePath = GraphQLPath.Definition.decode('User')
  const fieldPath = GraphQLPath.Definition.decode('User.name')
  const argPath = GraphQLPath.Definition.decode('User.posts(limit)')

  test('isTypeDefinitionPath', () => {
    expect(GraphQLPath.Definition.isTypeDefinitionPath(typePath)).toBe(true)
    expect(GraphQLPath.Definition.isTypeDefinitionPath(fieldPath)).toBe(false)
    expect(GraphQLPath.Definition.isTypeDefinitionPath(argPath)).toBe(false)
  })

  test('isFieldDefinitionPath', () => {
    expect(GraphQLPath.Definition.isFieldDefinitionPath(typePath)).toBe(false)
    expect(GraphQLPath.Definition.isFieldDefinitionPath(fieldPath)).toBe(true)
    expect(GraphQLPath.Definition.isFieldDefinitionPath(argPath)).toBe(false)
  })

  test('isArgumentDefinitionPath', () => {
    expect(GraphQLPath.Definition.isArgumentDefinitionPath(typePath)).toBe(false)
    expect(GraphQLPath.Definition.isArgumentDefinitionPath(fieldPath)).toBe(false)
    expect(GraphQLPath.Definition.isArgumentDefinitionPath(argPath)).toBe(true)
  })

  test('Effect Schema derived segment type guards', async () => {
    // Import from the types module directly since constructors re-exports them
    const { isTypeSegment, isFieldSegment, isArgumentSegment } = await import('./types.js')

    const typeSegment = { _tag: 'TypeSegment', type: 'User' } as const
    const fieldSegment = { _tag: 'FieldSegment', field: 'name' } as const
    const argSegment = { _tag: 'ArgumentSegment', argument: 'limit' } as const

    // Test that Effect Schema derived guards work correctly
    expect(isTypeSegment(typeSegment)).toBe(true)
    expect(isTypeSegment(fieldSegment)).toBe(false)
    expect(isFieldSegment(fieldSegment)).toBe(true)
    expect(isFieldSegment(typeSegment)).toBe(false)
    expect(isArgumentSegment(argSegment)).toBe(true)
    expect(isArgumentSegment(typeSegment)).toBe(false)
  })
})

describe('helper functions', () => {
  test('getType extracts type from all path types', () => {
    expect(GraphQLPath.Definition.getType(GraphQLPath.Definition.decode('User'))).toBe('User')
    expect(GraphQLPath.Definition.getType(GraphQLPath.Definition.decode('User.name'))).toBe('User')
    expect(GraphQLPath.Definition.getType(GraphQLPath.Definition.decode('User.posts(limit)'))).toBe('User')
  })

  test('getField extracts field name', () => {
    const fieldPath = GraphQLPath.Definition.decode('User.name')
    const argPath = GraphQLPath.Definition.decode('User.posts(limit)')

    if (GraphQLPath.Definition.isFieldDefinitionPath(fieldPath)) {
      expect(GraphQLPath.Definition.getField(fieldPath)).toBe('name')
    }
    if (GraphQLPath.Definition.isArgumentDefinitionPath(argPath)) {
      expect(GraphQLPath.Definition.getField(argPath)).toBe('posts')
    }
  })

  test('getArgument extracts argument name', () => {
    const argPath = GraphQLPath.Definition.decode('User.posts(limit)')
    if (GraphQLPath.Definition.isArgumentDefinitionPath(argPath)) {
      expect(GraphQLPath.Definition.getArgument(argPath)).toBe('limit')
    }
  })
})

describe('constructors', () => {
  test.for([
    [GraphQLPath.Definition.type('User'), [{ _tag: 'TypeSegment', type: 'User' }]],
    [GraphQLPath.Definition.field('User', 'name'), [
      { _tag: 'TypeSegment', type: 'User' },
      { _tag: 'FieldSegment', field: 'name' },
    ]],
    [GraphQLPath.Definition.argument('User', 'posts', 'limit'), [
      { _tag: 'TypeSegment', type: 'User' },
      { _tag: 'FieldSegment', field: 'posts' },
      { _tag: 'ArgumentSegment', argument: 'limit' },
    ]],
  ])('constructor creates correct structure', ([result, expected]) => {
    expect(result).toEqual(expected)
  })
})

describe('Schema validation', () => {
  test.for(
    [
      [GraphQLPath.Definition.TypeDefinitionPath, 'User', [{ _tag: 'TypeSegment', type: 'User' }]],
      [GraphQLPath.Definition.FieldDefinitionPath, 'User.name', [
        { _tag: 'TypeSegment', type: 'User' },
        { _tag: 'FieldSegment', field: 'name' },
      ]],
      [GraphQLPath.Definition.ArgumentDefinitionPath, 'User.posts(limit)', [
        { _tag: 'TypeSegment', type: 'User' },
        { _tag: 'FieldSegment', field: 'posts' },
        { _tag: 'ArgumentSegment', argument: 'limit' },
      ]],
    ] as const,
  )('validates through Effect Schema', ([schema, input, expected]) => {
    const result = S.decodeUnknownSync(schema as any)(input)
    expect(result).toEqual(expected)
  })

  test('union automatically selects correct type', () => {
    const typePath = S.decodeUnknownSync(GraphQLPath.Definition.DefinitionPath)('User')
    const fieldPath = S.decodeUnknownSync(GraphQLPath.Definition.DefinitionPath)('User.name')
    const argPath = S.decodeUnknownSync(GraphQLPath.Definition.DefinitionPath)('User.posts(limit)')

    expect(typePath.length).toBe(1)
    expect(fieldPath.length).toBe(2)
    expect(argPath.length).toBe(3)
  })
})
