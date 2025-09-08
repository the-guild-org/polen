import { Version } from '#lib/version/$'
import { HashMap } from 'effect'
import { describe, expect, test } from 'vitest'
import * as scanner from './scanner.js'

describe('parseExampleFile', () => {
  test.for([
    {
      input: 'get-user.graphql',
      expected: { type: 'unversioned', name: 'get-user', file: 'get-user.graphql' },
    },
    {
      input: 'get-user.1.graphql',
      expected: {
        type: 'versioned',
        name: 'get-user',
        version: Version.decodeSync('1'),
        file: 'get-user.1.graphql',
      },
    },
    {
      input: 'get-user.default.graphql',
      expected: {
        type: 'versioned',
        name: 'get-user',
        version: expect.objectContaining({ _tag: 'VersionCustom', value: 'default' }),
        file: 'get-user.default.graphql',
      },
    },
  ])('parses $input correctly', ({ input, expected }) => {
    expect(scanner.parseExampleFile(input)).toEqual(expected)
  })
})

describe('resolveDefaultFiles', () => {
  const v1 = Version.decodeSync('1')
  const v2 = Version.decodeSync('2')
  const v3 = Version.decodeSync('3')
  const schemaVersions = [v1, v2, v3]

  test.for([
    {
      name: 'unversioned file alone remains unversioned',
      grouped: new Map([['example', { unversioned: 'example.graphql', versioned: new Map() }]]),
      assertions: (resolved: ReturnType<typeof scanner.resolveDefaultFiles>) => {
        const example = resolved.get('example')!
        expect(example.unversioned).toBe('example.graphql')
        expect(HashMap.size(example.versionDocuments)).toBe(0)
      },
    },
    {
      name: 'unversioned file acts as default when versioned files exist',
      grouped: new Map([['example', {
        unversioned: 'example.graphql',
        versioned: new Map([[v1, 'example.1.graphql']]),
      }]]),
      assertions: (resolved: ReturnType<typeof scanner.resolveDefaultFiles>) => {
        const example = resolved.get('example')!
        expect(example.unversioned).toBeUndefined()
        expect(HashMap.size(example.versionDocuments)).toBe(2)
        expect(HashMap.has(example.versionDocuments, v1)).toBe(true)

        const entries = [...HashMap.entries(example.versionDocuments)]
        const defaultEntry = entries.find(([_, value]) => value === 'example.graphql')
        expect(defaultEntry).toBeDefined()
      },
    },
    {
      name: 'only versioned files when no unversioned exists',
      grouped: new Map([['example', {
        versioned: new Map([[v1, 'example.1.graphql'], [v2, 'example.2.graphql']]),
      }]]),
      assertions: (resolved: ReturnType<typeof scanner.resolveDefaultFiles>) => {
        const example = resolved.get('example')!
        expect(example.unversioned).toBeUndefined()
        expect(HashMap.size(example.versionDocuments)).toBe(2)
      },
    },
  ])('$name', ({ grouped, assertions }) => {
    const resolved = scanner.resolveDefaultFiles(grouped, schemaVersions)
    assertions(resolved)
  })
})
