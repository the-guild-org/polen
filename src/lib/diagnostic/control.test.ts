import { describe, expect, test } from 'vitest'
import { Control, getPhaseSettings } from './control.js'

describe('getPhaseSettings', () => {
  const defaults = { enabled: true, severity: 'warning' as const }

  test.for([
    { control: undefined, expected: defaults, name: 'undefined returns defaults' },
    { control: true, expected: { enabled: true, severity: 'warning' }, name: 'true enables with default severity' },
    { control: false, expected: { enabled: false, severity: 'warning' }, name: 'false disables' },
  ])('$name', ({ control, expected }) => {
    expect(getPhaseSettings(control, 'dev', defaults)).toEqual(expected)
  })

  test.for([
    { 
      control: { enabled: false }, 
      phase: 'dev' as const,
      expected: { enabled: false, severity: 'warning' },
      name: 'uses global enabled when phase not specified'
    },
    {
      control: { enabled: false, dev: { enabled: true } },
      phase: 'dev' as const,
      expected: { enabled: true, severity: 'warning' },
      name: 'phase settings override global enabled'
    },
    {
      control: { enabled: true, dev: { severity: 'error' } },
      phase: 'dev' as const,
      expected: { enabled: true, severity: 'error' },
      name: 'phase severity overrides default'
    },
    {
      control: { enabled: true, dev: { enabled: false } },
      phase: 'dev' as const,
      expected: { enabled: false, severity: 'warning' },
      name: 'phase enabled false overrides global true'
    },
    {
      control: { enabled: true, dev: { enabled: false }, build: { enabled: true, severity: 'error' } },
      phase: 'build' as const,
      expected: { enabled: true, severity: 'error' },
      name: 'build phase uses build settings'
    },
  ])('$name', ({ control, phase, expected }) => {
    expect(getPhaseSettings(Control.make(control), phase, defaults)).toEqual(expected)
  })

  test('different phases can have different severities', () => {
    const control = Control.make({
      enabled: true,
      dev: { severity: 'info' },
      build: { severity: 'error' },
    })
    expect(getPhaseSettings(control, 'dev', defaults)).toEqual({ enabled: true, severity: 'info' })
    expect(getPhaseSettings(control, 'build', defaults)).toEqual({ enabled: true, severity: 'error' })
  })
})

describe('Control.make', () => {
  test.for([
    { control: { enabled: true, dev: { enabled: false, severity: 'warning' as const }, build: { severity: 'error' as const } }, name: 'accepts valid control' },
    { control: { enabled: false }, name: 'accepts minimal control' },
  ])('$name', ({ control }) => {
    expect(() => Control.make(control)).not.toThrow()
  })
})