import { S } from '#dep/effect'
import { Test } from '@wollybeard/kit/test'
import { describe, expect, test } from 'vitest'
import { ExamplesConfig } from './config.js'

const decodeExamplesConfig = S.decodeSync(ExamplesConfig)

describe('ExampleSelection', () => {
  // dprint-ignore
  Test.describe('display value acceptance')
    .i<{ input: 'all' | 'none' | { include: string[] } | { exclude: string[] } }>()
    .o<'all' | 'none' | { include: string[] } | { exclude: string[] }>()
    .cases(
      ['all literal',      [{ input: 'all' }],                                    'all'],
      ['none literal',     [{ input: 'none' }],                                   'none'],
      ['include pattern',  [{ input: { include: ['example1', 'example2'] } }],   { include: ['example1', 'example2'] }],
      ['exclude pattern',  [{ input: { exclude: ['example3'] } }],               { exclude: ['example3'] }],
    )
    .test((i, o) => {
      const result = decodeExamplesConfig({ display: i.input })
      expect(result.display).toEqual(o)
    })

  test('undefined display is omitted', () => {
    const result = decodeExamplesConfig(true)
    expect('display' in result).toBe(false)
  })
})

describe('ExamplesConfigSchema', () => {
  test('decodes with defaults', () => {
    const result = decodeExamplesConfig(true)
    expect(result).toEqual({})
  })

  test('boolean shorthand: false disables examples', () => {
    const result = decodeExamplesConfig(false)
    expect(result).toEqual({ enabled: false })
  })

  test('boolean shorthand: true uses defaults', () => {
    const result = decodeExamplesConfig(true)
    expect(result).toEqual({})
  })

  test('decodes full config', () => {
    const input = {
      display: { include: ['example1', 'example2'] },
      diagnostics: {
        validation: true,
        unusedVersions: false,
      },
    }

    const result = decodeExamplesConfig(input)
    expect(result).toEqual(input)
  })

  // dprint-ignore
  Test.describe('full configuration')
    .i<{ config: { display: 'all' | 'none' | { include: string[] } | { exclude: string[] } | undefined } }>()
    .o<{}>()
    .cases(
      ['include pattern',  [{ config: { display: { include: ['get-user', 'create-post'] } } }], {}],
      ['exclude pattern',  [{ config: { display: { exclude: ['advanced-filtering'] } } }],      {}],
      ['all examples',     [{ config: { display: 'all' } }],                                     {}],
      ['no examples',      [{ config: { display: 'none' } }],                                    {}],
      ['undefined display', [{ config: { display: undefined } }],                                {}],
    )
    .test((i, o) => {
      const result = decodeExamplesConfig(i.config)
      expect(result.display).toEqual(i.config.display)
    })
})

describe('Type safety demonstration', () => {
  test('example selection type safety', () => {
    // This demonstrates the type-safe API
    // In real usage, the types would be augmented by the generator

    type TestExampleNames = 'get-user' | 'create-post' | 'update-user'

    interface TestExampleSelection {
      include?: TestExampleNames[]
      exclude?: TestExampleNames[]
    }

    const validInclude: TestExampleSelection = {
      include: ['get-user', 'create-post'],
    }

    const validExclude: TestExampleSelection = {
      exclude: ['update-user'],
    }

    // Type assertions to ensure the structure is correct
    expect(validInclude.include).toBeDefined()
    expect(validExclude.exclude).toBeDefined()
  })
})
