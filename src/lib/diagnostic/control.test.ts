import { describe, expect, test } from 'vitest'
import { DiagnosticControl, getPhaseSettings } from './control.js'

describe('DiagnosticControl', () => {
  describe('getPhaseSettings', () => {
    const defaults = { enabled: true, severity: 'warning' as const }

    test('returns defaults when control is undefined', () => {
      const result = getPhaseSettings(undefined, 'dev', defaults)
      expect(result).toEqual(defaults)
    })

    test('boolean true enables with default severity', () => {
      const result = getPhaseSettings(true, 'dev', defaults)
      expect(result).toEqual({ enabled: true, severity: 'warning' })
    })

    test('boolean false disables', () => {
      const result = getPhaseSettings(false, 'dev', defaults)
      expect(result).toEqual({ enabled: false, severity: 'warning' })
    })

    test('uses global enabled when phase not specified', () => {
      const control = DiagnosticControl.make({
        enabled: false,
      })
      const result = getPhaseSettings(control, 'dev', defaults)
      expect(result).toEqual({ enabled: false, severity: 'warning' })
    })

    test('phase settings override global enabled', () => {
      const control = DiagnosticControl.make({
        enabled: false,
        dev: { enabled: true },
      })
      const result = getPhaseSettings(control, 'dev', defaults)
      expect(result).toEqual({ enabled: true, severity: 'warning' })
    })

    test('phase severity overrides default', () => {
      const control = DiagnosticControl.make({
        enabled: true,
        dev: { severity: 'error' },
      })
      const result = getPhaseSettings(control, 'dev', defaults)
      expect(result).toEqual({ enabled: true, severity: 'error' })
    })

    test('phase enabled false overrides global true', () => {
      const control = DiagnosticControl.make({
        enabled: true,
        dev: { enabled: false },
      })
      const result = getPhaseSettings(control, 'dev', defaults)
      expect(result).toEqual({ enabled: false, severity: 'warning' })
    })

    test('build phase uses build settings', () => {
      const control = DiagnosticControl.make({
        enabled: true,
        dev: { enabled: false },
        build: { enabled: true, severity: 'error' },
      })
      const result = getPhaseSettings(control, 'build', defaults)
      expect(result).toEqual({ enabled: true, severity: 'error' })
    })

    test.for([
      { phase: 'dev' as const, expectedSeverity: 'info' as const },
      { phase: 'build' as const, expectedSeverity: 'error' as const },
    ])('different phases can have different severities ($phase)', ({ phase, expectedSeverity }) => {
      const control = DiagnosticControl.make({
        enabled: true,
        dev: { severity: 'info' },
        build: { severity: 'error' },
      })
      const result = getPhaseSettings(control, phase, defaults)
      expect(result).toEqual({ enabled: true, severity: expectedSeverity })
    })
  })

  describe('schema validation', () => {
    test('accepts valid DiagnosticControl', () => {
      const control = {
        enabled: true,
        dev: { enabled: false, severity: 'warning' as const },
        build: { severity: 'error' as const },
      }
      expect(() => DiagnosticControl.make(control)).not.toThrow()
    })

    test('accepts minimal DiagnosticControl', () => {
      const control = { enabled: false }
      expect(() => DiagnosticControl.make(control)).not.toThrow()
    })
  })
})