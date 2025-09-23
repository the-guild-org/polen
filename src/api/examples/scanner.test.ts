import { FsLoc } from '@wollybeard/kit'
import { Test } from '@wollybeard/kit/test'
import { HashMap } from 'effect'
import { Version } from 'graphql-kit'
import { describe, expect } from 'vitest'
import * as scanner from './scanner.js'

describe('parseExampleFile', () => {
  type ParseInput = { input: string }
  type ParseOutput = { expected: any }

  // dprint-ignore
  Test.Table.suite<ParseInput, ParseOutput>('parsing', [
    { n: 'unversioned file',  i: { input: 'get-user.graphql' },         o: { expected: { type: 'unversioned', name: 'get-user', file: FsLoc.RelFile.decodeSync('get-user.graphql') } } },
    { n: 'versioned file',    i: { input: 'get-user.1.graphql' },      o: { expected: { type: 'versioned', name: 'get-user', version: Version.decodeSync('1'), file: FsLoc.RelFile.decodeSync('get-user.1.graphql') } } },
    { n: 'custom version',    i: { input: 'get-user.default.graphql' }, o: { expected: { type: 'versioned', name: 'get-user', version: expect.objectContaining({ _tag: 'VersionCustom', value: 'default' }), file: FsLoc.RelFile.decodeSync('get-user.default.graphql') } } },
  ], ({ i, o }) => {
    const inputLoc = FsLoc.RelFile.decodeSync(i.input)
    expect(scanner.parseExampleFile(inputLoc)).toEqual(o.expected)
  })
})

describe('resolveDefaultFiles', () => {
  const v1 = Version.decodeSync('1')
  const v2 = Version.decodeSync('2')
  const v3 = Version.decodeSync('3')
  const schemaVersions = [v1, v2, v3]

  type DefaultFileInput = { grouped: any }
  type DefaultFileOutput = { assertions: (resolved: ReturnType<typeof scanner.resolveDefaultFiles>) => void }

  // dprint-ignore
  Test.Table.suite<DefaultFileInput, DefaultFileOutput>('default file resolution', [
    {
      n: 'unversioned file alone remains unversioned',
      i: { grouped: new Map([['example', { unversioned: 'example.graphql', versioned: new Map() }]]) },
      o: { assertions: (resolved: ReturnType<typeof scanner.resolveDefaultFiles>) => {
        const example = resolved.get('example')!
        expect(example.unversioned).toBe('example.graphql')
        expect(HashMap.size(example.versionDocuments)).toBe(0)
      } },
    },
    {
      n: 'unversioned file acts as default when versioned files exist',
      i: { grouped: new Map([['example', {
        unversioned: 'example.graphql',
        versioned: new Map([[v1, 'example.1.graphql']]),
      }]]) },
      o: { assertions: (resolved: ReturnType<typeof scanner.resolveDefaultFiles>) => {
        const example = resolved.get('example')!
        expect(example.unversioned).toBeUndefined()
        expect(HashMap.size(example.versionDocuments)).toBe(2)
        expect(HashMap.has(example.versionDocuments, v1)).toBe(true)

        const entries = [...HashMap.entries(example.versionDocuments)]
        const defaultEntry = entries.find(([_, value]) => FsLoc.encodeSync(value) === 'example.graphql')
        expect(defaultEntry).toBeDefined()
      } },
    },
    {
      n: 'only versioned files when no unversioned exists',
      i: { grouped: new Map([['example', {
        unversioned: undefined,
        versioned: new Map([[v1, FsLoc.RelFile.decodeSync('example.1.graphql')], [v2, FsLoc.RelFile.decodeSync('example.2.graphql')]]),
      }]]) },
      o: { assertions: (resolved: ReturnType<typeof scanner.resolveDefaultFiles>) => {
        const example = resolved.get('example')!
        expect(example.unversioned).toBeUndefined()
        expect(HashMap.size(example.versionDocuments)).toBe(2)
      } },
    },
  ], ({ i, o }) => {
    const resolved = scanner.resolveDefaultFiles(i.grouped, schemaVersions)
    o.assertions(resolved)
  })
})
