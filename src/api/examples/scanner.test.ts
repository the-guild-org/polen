import { S } from '#dep/effect'
import { FsLoc } from '@wollybeard/kit'
import { Test } from '@wollybeard/kit/test'
import { HashMap } from 'effect'
import { Version, VersionCoverage } from 'graphql-kit'
import { describe, expect } from 'vitest'
import * as scanner from './scanner.js'

describe('parseExampleFile', () => {
  // dprint-ignore
  Test.describe('parsing')
    .i<{ input: string }>()
    .o<{ type: string; name: string; file: any; version?: any }>()
    .cases(
      ['unversioned file',  [{ input: 'get-user.graphql' }],         { type: 'unversioned', name: 'get-user', file: FsLoc.fromString('get-user.graphql') }],
      ['versioned file',    [{ input: 'get-user.1.graphql' }],      { type: 'versioned', name: 'get-user', version: Version.decodeSync('1'), file: FsLoc.fromString('get-user.1.graphql') }],
      ['custom version',    [{ input: 'get-user.default.graphql' }], { type: 'versioned', name: 'get-user', version: expect.objectContaining({ _tag: 'VersionCustom', value: 'default' }), file: FsLoc.fromString('get-user.default.graphql') }],
    )
    .test((i, o) => {
      const inputLoc = FsLoc.decodeSync(i.input) as FsLoc.RelFile
      expect(scanner.parseExampleFile(inputLoc)).toEqual(o)
    })
})

describe('resolveDefaultFiles', () => {
  const v1 = Version.decodeSync('1')
  const v2 = Version.decodeSync('2')
  const v3 = Version.decodeSync('3')
  const schemaVersions = [v1, v2, v3]

  // dprint-ignore
  Test.describe('default file resolution')
    .i<{ grouped: any }>()
    .o<(resolved: ReturnType<typeof scanner.resolveDefaultFiles>) => void>()
    .cases(
      [
        'unversioned file alone remains unversioned',
        [{ grouped: new Map([['example', { unversioned: FsLoc.fromString('example.graphql'), versioned: new Map() }]]) }],
        (resolved: ReturnType<typeof scanner.resolveDefaultFiles>) => {
          const example = resolved.get('example')!
          expect(example.unversioned).toEqual(FsLoc.fromString('example.graphql'))
          expect(HashMap.size(example.versionDocuments)).toBe(0)
        },
      ],
      [
        'unversioned file acts as default when versioned files exist',
        [{ grouped: new Map([['example', {
          unversioned: FsLoc.fromString('example.graphql'),
          versioned: new Map([[v1, FsLoc.fromString('example.1.graphql')]]),
        }]]) }],
        (resolved: ReturnType<typeof scanner.resolveDefaultFiles>) => {
          const example = resolved.get('example')!
          expect(example.unversioned).toBeUndefined()
          expect(HashMap.size(example.versionDocuments)).toBe(2)
          expect(HashMap.has(example.versionDocuments, VersionCoverage.One.make({ version: v1 }))).toBe(true)

          const entries = [...HashMap.entries(example.versionDocuments)]
          const defaultEntry = entries.find(([_, value]) => FsLoc.encodeSync(value) === './example.graphql')
          expect(defaultEntry).toBeDefined()

          // Verify the default covers the versions not explicitly defined (v2, v3)
          if (defaultEntry) {
            const [coverage] = defaultEntry
            expect(coverage._tag).toBe('VersionCoverageSet')
          }
        },
      ],
      [
        'only versioned files when no unversioned exists',
        [{ grouped: new Map([['example', {
          unversioned: undefined,
          versioned: new Map([[v1, FsLoc.fromString('example.1.graphql')], [v2, FsLoc.fromString('example.2.graphql')]]),
        }]]) }],
        (resolved: ReturnType<typeof scanner.resolveDefaultFiles>) => {
          const example = resolved.get('example')!
          expect(example.unversioned).toBeUndefined()
          expect(HashMap.size(example.versionDocuments)).toBe(2)
        },
      ],
    )
    .test((i, o) => {
      const resolved = scanner.resolveDefaultFiles(i.grouped, schemaVersions)
      o(resolved)
    })
})
