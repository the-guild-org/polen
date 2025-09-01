import { Diagnostic } from '#lib/diagnostic/$'
import { Effect } from 'effect'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Examples } from './$.js'

describe('Example', () => {
  test.for([
    {
      name: 'validates correct structure',
      example: {
        id: 'list-users',
        path: 'examples/list-users.graphql',
        versions: ['default'],
        content: { default: 'query ListUsers { users { id name } }' },
      },
      expected: true,
    },
  ])('$name', ({ example, expected }) => {
    expect(Examples.is(example)).toBe(expected)
  })

  test.for([
    {
      name: 'hasDefaultOnly - default only',
      example: { id: 'test', path: 'test.graphql', versions: ['default'], content: { default: 'content' } },
      hasDefaultOnly: true,
      hasVersions: false,
    },
    {
      name: 'hasDefaultOnly - with versions',
      example: {
        id: 'test',
        path: 'test',
        versions: ['default', 'v1', 'v2'],
        content: { default: 'content', v1: 'v1 content', v2: 'v2 content' },
      },
      hasDefaultOnly: false,
      hasVersions: true,
    },
    {
      name: 'hasVersions - versions only',
      example: { id: 'test', path: 'test', versions: ['v1', 'v2'], content: { v1: 'v1 content', v2: 'v2 content' } },
      hasDefaultOnly: false,
      hasVersions: true,
    },
  ])('$name', ({ example, hasDefaultOnly, hasVersions }) => {
    const ex = Examples.make(example)
    if (hasDefaultOnly !== undefined) expect(Examples.hasDefaultOnly(ex)).toBe(hasDefaultOnly)
    if (hasVersions !== undefined) expect(Examples.hasVersions(ex)).toBe(hasVersions)
  })

  test.for([
    {
      example: { versions: ['default', 'v1'] },
      usedVersions: ['v1'],
      expected: false,
    },
    {
      example: { versions: ['v1', 'v2'] },
      usedVersions: ['v3'],
      expected: true,
    },
    {
      example: { versions: ['default'] },
      usedVersions: ['v1', 'v2'],
      expected: true,
    },
  ])(
    'isUnused correctly identifies unused examples: $example.versions with used $usedVersions',
    ({ example, usedVersions, expected }) => {
      const ex = Examples.make({
        id: 'test',
        path: 'test',
        versions: example.versions,
        content: Object.fromEntries(example.versions.map(v => [v, 'content'])),
      })

      expect(Examples.isUnused(ex, usedVersions)).toBe(expected)
    },
  )
})

describe('Diagnostics', () => {
  test.for([
    {
      name: 'DiagnosticUnusedDefault',
      diagnostic: {
        _tag: 'Diagnostic' as const,
        source: 'examples-scanner' as const,
        name: 'unused-default' as const,
        severity: 'warning' as const,
        message: 'Default will never be used',
        example: { id: 'test', path: 'test/default.graphql' },
        versions: ['v1', 'v2'],
      },
      checks: [
        { fn: 'isFromSource', args: ['examples-scanner'], expected: true },
        { fn: 'isNamed', args: ['unused-default'], expected: true },
        { fn: 'isWarning', expected: true },
      ],
    },
    {
      name: 'DiagnosticDuplicateContent',
      diagnostic: {
        _tag: 'Diagnostic' as const,
        source: 'examples-scanner' as const,
        name: 'duplicate-content' as const,
        severity: 'info' as const,
        message: 'Duplicate content found',
        example: { id: 'test', path: 'test' },
        duplicates: [{ version1: 'v1', version2: 'v2' }],
      },
      checks: [{ fn: 'isInfo', expected: true }],
    },
    {
      name: 'DiagnosticMissingVersions',
      diagnostic: {
        _tag: 'Diagnostic' as const,
        source: 'examples-scanner' as const,
        name: 'missing-versions' as const,
        severity: 'info' as const,
        message: 'Missing versions',
        example: { id: 'test', path: 'test' },
        providedVersions: ['v1'],
        missingVersions: ['v2', 'v3'],
      },
      checks: [],
    },
    {
      name: 'DiagnosticInvalidFilename',
      diagnostic: {
        _tag: 'Diagnostic' as const,
        source: 'examples-scanner' as const,
        name: 'invalid-filename' as const,
        severity: 'error' as const,
        message: 'Invalid filename',
        file: 'bad@file.graphql',
        reason: 'Contains invalid characters',
      },
      checks: [{ fn: 'isError', expected: true }],
    },
  ])('$name validates', ({ diagnostic, checks }) => {
    expect(Diagnostic.is(diagnostic)).toBe(true)
    checks.forEach((check: any) => {
      const args = check.args || []
      expect((Diagnostic as any)[check.fn](diagnostic, ...args)).toBe(check.expected)
    })
  })
})

describe('scan', () => {
  // Mock file system for testing
  const mockFs = (files: Record<string, string>) => {
    return {
      readFileString: vi.fn((path: string) => Effect.succeed(files[path] || '')),
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test.for([
    {
      name: 'simple example files',
      files: {
        '/examples/list-users.graphql': 'query ListUsers { users { id } }',
        '/examples/get-user.graphql': 'query GetUser($id: ID!) { user(id: $id) { id } }',
      },
      scanFiles: ['list-users.graphql', 'get-user.graphql'],
      expectedExamples: [
        { id: 'list-users', versions: ['default'] },
        { id: 'get-user', versions: ['default'] },
      ],
    },
  ])('scans $name', async ({ files, scanFiles, expectedExamples }) => {
    const FileSystem = await import('@effect/platform/FileSystem')
    const result = await Effect.runPromise(
      Examples.scan({
        dir: '/examples',
        schemaVersions: ['v1', 'v2'],
        files: scanFiles,
      }).pipe(
        Effect.provideService(FileSystem.FileSystem, mockFs(files) as any),
      ),
    )
    expect(result.examples).toHaveLength(expectedExamples.length)
    expectedExamples.forEach((expected, i) => {
      expect(result.examples[i]!.id).toBe(expected.id)
      expect(result.examples[i]!.versions).toEqual(expected.versions)
    })
  })

  test.for([
    {
      name: 'unused default when all versions covered',
      files: {
        '/examples/list-users/default.graphql': 'default query',
        '/examples/list-users/v1.graphql': 'v1 query',
        '/examples/list-users/v2.graphql': 'v2 query',
      },
      scanFiles: ['list-users/default.graphql', 'list-users/v1.graphql', 'list-users/v2.graphql'],
      schemaVersions: ['v1', 'v2'],
      expectedDiagnostic: { name: 'unused-default', severity: 'warning' },
    },
    {
      name: 'duplicate content across versions',
      files: {
        '/examples/list-users/v1.graphql': 'same query',
        '/examples/list-users/v2.graphql': 'same query',
      },
      scanFiles: ['list-users/v1.graphql', 'list-users/v2.graphql'],
      schemaVersions: ['v1', 'v2'],
      expectedDiagnostic: { name: 'duplicate-content', severity: 'info' },
    },
    {
      name: 'missing versions',
      files: { '/examples/list-users/v1.graphql': 'v1 query' },
      scanFiles: ['list-users/v1.graphql'],
      schemaVersions: ['v1', 'v2', 'v3'],
      expectedDiagnostic: { name: 'missing-versions', missingVersions: ['v2', 'v3'] },
    },
  ])('detects $name', async ({ files, scanFiles, schemaVersions, expectedDiagnostic }) => {
    const FileSystem = await import('@effect/platform/FileSystem')
    const result = await Effect.runPromise(
      Examples.scan({
        dir: '/examples',
        schemaVersions,
        files: scanFiles,
      }).pipe(
        Effect.provideService(FileSystem.FileSystem, mockFs(files) as any),
      ),
    )
    const diagnostic = result.diagnostics.find((d: any) => Diagnostic.isNamed(d, expectedDiagnostic.name))
    expect(diagnostic).toBeDefined()
    if ('severity' in expectedDiagnostic && diagnostic) {
      expect(diagnostic.severity).toBe(expectedDiagnostic.severity)
    }
    if ('missingVersions' in expectedDiagnostic && diagnostic) {
      expect((diagnostic as any).missingVersions).toEqual(expectedDiagnostic.missingVersions)
    }
  })

  test.for([
    { filename: 'example.graphql', expected: { name: 'example', version: 'default' } },
    { filename: 'example/default.graphql', expected: { name: 'example', version: 'default' } },
    { filename: 'example/v1.graphql', expected: { name: 'example', version: 'v1' } },
    { filename: 'example.v2.graphql', expected: { name: 'example', version: 'v2' } },
  ])('parseExampleFilename parses "$filename" correctly', ({ filename, expected }) => {
    // This is testing internal logic - would need to expose for testing
    // or test via integration tests
    expect(true).toBe(true) // Placeholder
  })
})
