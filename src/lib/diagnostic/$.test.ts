import { S } from 'graphql-kit'
import { Ts } from '@wollybeard/kit'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Diagnostic } from './$.js'

describe('DiagnosticBase', () => {
  test('validates base structure', () => {
    const valid = {
      _tag: 'Diagnostic' as const,
      source: 'test-source',
      name: 'test-name',
      severity: 'error' as const,
      message: 'Test message',
    }

    expect(Diagnostic.is(valid)).toBe(true)
  })

  test.for([
    { field: '_tag', value: 'NotDiagnostic' },
    { field: 'source', value: 123 },
    { field: 'name', value: null },
    { field: 'severity', value: 'critical' },
    { field: 'message', value: true },
  ])('rejects invalid $field', ({ field, value }) => {
    const invalid = {
      _tag: 'Diagnostic' as const,
      source: 'test-source',
      name: 'test-name',
      severity: 'error' as const,
      message: 'Test message',
      [field]: value,
    }

    expect(Diagnostic.is(invalid)).toBe(false)
  })
})

describe('report', () => {
  const spy = vi.spyOn(console, 'warn')

  beforeEach(() => spy.mockClear())

  test('handles empty array', () => {
    Diagnostic.report([])
    expect(spy).not.toHaveBeenCalled()
  })

  test.for([
    {
      name: 'groups by source',
      diagnostics: [
        { source: 'source-a', name: 'error-1', severity: 'error' as const, message: 'Error from A' },
        { source: 'source-b', name: 'warning-1', severity: 'warning' as const, message: 'Warning from B' },
        { source: 'source-a', name: 'error-2', severity: 'error' as const, message: 'Another error from A' },
      ],
      expectedInOutput: ['source-a', 'source-b', 'Error from A', 'Warning from B', 'Another error from A'],
    },
    {
      name: 'uses severity icons',
      diagnostics: [
        { source: 'test', name: 'e', severity: 'error' as const, message: 'E' },
        { source: 'test', name: 'w', severity: 'warning' as const, message: 'W' },
        { source: 'test', name: 'i', severity: 'info' as const, message: 'I' },
      ],
      expectedInOutput: ['✗', '⚠', 'ⓘ'],
    },
  ])('$name', ({ diagnostics, expectedInOutput }) => {
    const fullDiagnostics = diagnostics.map(d => ({ _tag: 'Diagnostic' as const, ...d }))
    Diagnostic.report(fullDiagnostics)

    expect(spy).toHaveBeenCalled()
    const output = spy.mock.calls.map(call => call.join('')).join('')
    expectedInOutput.forEach(expected => {
      expect(output).toContain(expected)
    })
  })
})

describe('extending DiagnosticBase', () => {
  test('can extend base schema with additional fields', () => {
    // Example of how features would use the create helper
    const CustomDiagnostic = Diagnostic.create({
      source: 'custom-feature',
      name: 'custom-error',
      severity: 'error',
      context: {
        customField: S.String,
        lineNumber: S.Number,
      },
    })
    const makeCustomDiagnostic = Diagnostic.createMake(CustomDiagnostic)

    type CustomDiagnostic = S.Schema.Type<typeof CustomDiagnostic>

    const diagnostic = makeCustomDiagnostic({
      message: 'Custom error occurred',
      customField: 'extra data',
      lineNumber: 42,
    })

    // Should be valid for both base and extended schemas
    expect(Diagnostic.is(diagnostic)).toBe(true)
    expect(S.is(CustomDiagnostic)(diagnostic)).toBe(true)

    // Type assertion to ensure it's assignable to base
    Ts.assertSub<Diagnostic.Diagnostic>()(diagnostic)
  })
})
