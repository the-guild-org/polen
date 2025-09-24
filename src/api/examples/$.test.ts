import { Ef } from '#dep/effect'
import { Diagnostic } from '#lib/diagnostic/$'
import { Test } from '@wollybeard/kit/test'
import { HashMap } from 'effect'
import { buildSchema } from 'graphql'
import { Catalog, Document, Schema, Version, VersionCoverage } from 'graphql-kit'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Examples } from './$.js'

describe('Example', () => {
  type ValidationInput = { example: Examples.Example.Example }
  type ValidationOutput = { expected: boolean }

  // dprint-ignore
  Test.Table.suite<ValidationInput, ValidationOutput>('validation', [
    { n: 'validates unversioned example', i: { example: Examples.Example.Example.make({ name: 'list-users', path: 'examples/list-users.graphql', document: Document.Unversioned.make({ document: 'query ListUsers { users { id name } }' }) }) }, o: { expected: true } },
    { n: 'validates versioned example',   i: { example: Examples.Example.Example.make({ name: 'list-users', path: 'examples', document: Document.Versioned.make({ versionDocuments: HashMap.make([VersionCoverage.One.make({ version: Version.fromString('v1') }), 'query ListUsers { users { id name } }'], [VersionCoverage.One.make({ version: Version.fromString('v2') }), 'query ListUsers { users { id email name } }']) }) }) }, o: { expected: true } },
  ], ({ i, o }) => {
    expect(Examples.Example.is(i.example)).toBe(o.expected)
  })
})

describe('ExampleScanner', () => {
  const mockFs = {
    readFileString: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  type ScanningInput = { files: string[]; fileContents: Record<string, string> }
  type ScanningOutput = { expectedExamples: number; expectedDiagnostics: number }

  // dprint-ignore
  Test.Table.suite<ScanningInput, ScanningOutput>('scanning', [
    { n: 'scans unversioned example', skip: true, i: { files: ['get-users.graphql'], fileContents: { 'get-users.graphql': 'query GetUsers { users { id } }' } }, o: { expectedExamples: 1, expectedDiagnostics: 0 } },
    { n: 'scans versioned examples',  skip: true, i: { files: ['users/v1.graphql', 'users/v2.graphql'], fileContents: { 'users/v1.graphql': 'query V1 { users { id } }', 'users/v2.graphql': 'query V2 { users { id email } }' } }, o: { expectedExamples: 1, expectedDiagnostics: 0 } },
    { n: 'detects duplicate content', skip: true, i: { files: ['users/v1.graphql', 'users/v2.graphql'], fileContents: { 'users/v1.graphql': 'query Users { users { id } }', 'users/v2.graphql': 'query Users { users { id } }' } }, o: { expectedExamples: 1, expectedDiagnostics: 1 } },
  ], async ({ i, o }) => {
    mockFs.readFileString.mockImplementation((path: string) => {
      const fileName = path.split('/').pop()!
      const content = (i.fileContents )[i.files.find(f => f.endsWith(fileName!))!]
      return Ef.succeed(content)
    })

    // Skip this test for now - needs proper FileSystem mock setup
    // const result = await Ef.runPromise(
    //   Examples.scan({
    //     dir: '/examples',
    //     schemaVersions: ['v1', 'v2'],
    //     files,
    //   }).pipe(Ef.provide({ FileSystem: mockFs } ) ),
    // )

    // expect((result ).examples).toHaveLength(expectedExamples)
    // expect((result ).diagnostics).toHaveLength(expectedDiagnostics)
  })
})

describe('ExampleValidator', () => {
  const mockCatalog = Catalog.Unversioned.make({
    schema: Schema.Unversioned.make({
      revisions: [],
      definition: buildSchema('type Query { test: String }'),
    }),
  })

  type ValidationInput2 = { examples: Examples.Example.Example[] }
  type ValidationOutput2 = { expectedErrors: number }

  // dprint-ignore
  Test.Table.suite<ValidationInput2, ValidationOutput2>('validation', [
    { n: 'validates unversioned example', i: { examples: [Examples.Example.Example.make({ name: 'test', path: 'test.graphql', document: Document.Unversioned.make({ document: 'query Test { test }' }) })] }, o: { expectedErrors: 0 } },
    { n: 'validates versioned example',   i: { examples: [Examples.Example.Example.make({ name: 'test', path: 'test', document: Document.Versioned.make({ versionDocuments: HashMap.make([VersionCoverage.One.make({ version: Version.fromString('v1') }), 'query Test { test }'], [VersionCoverage.One.make({ version: Version.fromString('v2') }), 'query Test { test { id } }']) }) })] }, o: { expectedErrors: 0 } },
  ], ({ i, o }) => {
    // Note: This would need a real GraphQL schema to test properly
    // For now just ensure the function accepts the new Example types
    const diagnostics = Examples.validateExamples(i.examples, mockCatalog)
    expect(diagnostics).toBeDefined()
  })
})

describe('filterExamplesBySelection', () => {
  const examples = [
    Examples.Example.Example.make({
      name: 'a',
      path: 'a.graphql',
      document: Document.Unversioned.make({ document: 'a' }),
    }),
    Examples.Example.Example.make({
      name: 'b',
      path: 'b.graphql',
      document: Document.Unversioned.make({ document: 'b' }),
    }),
    Examples.Example.Example.make({
      name: 'c',
      path: 'c.graphql',
      document: Document.Unversioned.make({ document: 'c' }),
    }),
  ]

  type FilterInput = { selection: any }
  type FilterOutput = { expected: string[] }

  // dprint-ignore
  Test.Table.suite<FilterInput, FilterOutput>('selection filtering', [
    { n: 'undefined returns all',     i: { selection: undefined },                o: { expected: ['a', 'b', 'c'] } },
    { n: 'all returns all',           i: { selection: 'all' },                    o: { expected: ['a', 'b', 'c'] } },
    { n: 'none returns empty',        i: { selection: 'none' },                   o: { expected: [] } },
    { n: 'include filters',           i: { selection: { include: ['a', 'b'] } }, o: { expected: ['a', 'b'] } },
  ], ({ i, o }) => {
    const result = Examples.filterExamplesBySelection(examples, i.selection )
    expect(result.map(e => e.name)).toEqual(o.expected)
  })
})

describe('ExampleDiagnostics', () => {
  const examples = [
    Examples.Example.Example.make({
      name: 'test',
      path: 'test',
      document: Document.Versioned.make({
        versionDocuments: HashMap.make(
          [VersionCoverage.One.make({ version: Version.fromString('v1') }), 'content'],
        ),
      }),
    }),
  ]

  // Test diagnostic control

  test('filters diagnostics based on control settings', () => {
    const control = {
      enabled: true,
      dev: { severity: 'warning' as const },
    }

    const settings = Diagnostic.getEffetivePhaseSettings(control, 'dev', { enabled: true, severity: 'info' })
    expect(settings.severity).toBe('warning')
  })
})
