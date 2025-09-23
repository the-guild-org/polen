import { S } from '#dep/effect'
import { Test } from '@wollybeard/kit/test'
import { describe, expect, test } from 'vitest'
import { ExamplesConfig } from './config.js'

describe('ExamplesConfig', () => {
  const decodeExamplesConfig = S.decodeSync(ExamplesConfig)

  describe('ExampleSelection', () => {
    type DisplayInput = { input: 'all' | 'none' | { include: string[] } | { exclude: string[] } }
    type DisplayOutput = { expected: 'all' | 'none' | { include: string[] } | { exclude: string[] } }

    // dprint-ignore
    Test.Table.suite<DisplayInput, DisplayOutput>('display value acceptance', [
      { n: 'all literal',      i: { input: 'all' },                                    o: { expected: 'all' } },
      { n: 'none literal',     i: { input: 'none' },                                   o: { expected: 'none' } },
      { n: 'include pattern',  i: { input: { include: ['example1', 'example2'] } },   o: { expected: { include: ['example1', 'example2'] } } },
      { n: 'exclude pattern',  i: { input: { exclude: ['example3'] } },               o: { expected: { exclude: ['example3'] } } },
    ], ({ i, o }) => {
      const result = decodeExamplesConfig({ display: i.input })
      expect(result.display).toEqual(o.expected)
    })

    test('undefined display is omitted', () => {
      const result = decodeExamplesConfig({})
      expect('display' in result).toBe(false)
    })
  })

  describe('ExamplesConfigSchema', () => {
    test('decodes with defaults', () => {
      const result = decodeExamplesConfig({})
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

    type FullConfigInput = { config: { display?: 'all' | 'none' | { include: string[] } | { exclude: string[] } } }
    type FullConfigOutput = {}

    // dprint-ignore
    Test.Table.suite<FullConfigInput, FullConfigOutput>('full configuration', [
      { n: 'include pattern',  i: { config: { display: { include: ['get-user', 'create-post'] } } }, o: {} },
      { n: 'exclude pattern',  i: { config: { display: { exclude: ['advanced-filtering'] } } },      o: {} },
      { n: 'all examples',     i: { config: { display: 'all' } },                                     o: {} },
      { n: 'no examples',      i: { config: { display: 'none' } },                                    o: {} },
    ], ({ i, o }) => {
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
})
