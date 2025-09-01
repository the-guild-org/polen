import { S } from '#lib/kit-temp/effect'
import { describe, expect, test } from 'vitest'
import { ExamplesConfig } from './config.js'

describe('ExamplesConfig', () => {
  const decodeExamplesConfig = S.decodeSync(ExamplesConfig)

  describe('ExampleSelection', () => {
    test.for([
      { input: 'all', expected: 'all' },
      { input: 'none', expected: 'none' },
      { input: { include: ['example1', 'example2'] }, expected: { include: ['example1', 'example2'] } },
      { input: { exclude: ['example3'] }, expected: { exclude: ['example3'] } },
    ])('accepts $input as display value', ({ input, expected }) => {
      const result = decodeExamplesConfig({ display: input })
      expect(result.display).toEqual(expected)
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

    test('decodes full config', () => {
      const input = {
        display: { include: ['example1', 'example2'] },
        validate: false,
        showExecutionTime: true,
        maxHomePageExamples: 5,
      }

      const result = decodeExamplesConfig(input)
      expect(result).toEqual(input)
    })

    test.for([
      {
        name: 'include pattern',
        config: { display: { include: ['get-user', 'create-post'] } },
      },
      {
        name: 'exclude pattern',
        config: { display: { exclude: ['advanced-filtering'] } },
      },
      {
        name: 'all examples',
        config: { display: 'all' },
      },
      {
        name: 'no examples',
        config: { display: 'none' },
      },
    ])('accepts $name', ({ config }) => {
      const result = decodeExamplesConfig(config)
      expect(result.display).toEqual(config.display)
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
