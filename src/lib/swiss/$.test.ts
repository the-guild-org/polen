import { describe, expect, test } from 'vitest'
import { extractSpacingProps } from './utils.js'

describe('Swiss Grid Radix Props Integration', () => {
  test('extractSpacingProps handles margin props', () => {
    const props = {
      mt: '4',
      mb: '2',
      mx: { initial: '3', md: '5' },
      otherProp: 'value',
    }

    const result = extractSpacingProps(props)

    // Should have className and style properties
    expect(result).toHaveProperty('className')
    expect(result).toHaveProperty('style')

    // Should not have the margin props in the result
    expect(result).not.toHaveProperty('mt')
    expect(result).not.toHaveProperty('mb')
    expect(result).not.toHaveProperty('mx')

    // Should preserve other props
    expect(result.otherProp).toBe('value')
  })

  test('extractSpacingProps handles padding props', () => {
    const props = {
      p: '6',
      py: { xs: '2', lg: '8' },
      pl: '9',
      customProp: 'test',
    }

    const result = extractSpacingProps(props)

    // Should have className and style properties
    expect(result).toHaveProperty('className')
    expect(result).toHaveProperty('style')

    // Should not have the padding props in the result
    expect(result).not.toHaveProperty('p')
    expect(result).not.toHaveProperty('py')
    expect(result).not.toHaveProperty('pl')

    // Should preserve other props
    expect(result.customProp).toBe('test')
  })

  test('extractSpacingProps handles both margin and padding props', () => {
    const props = {
      m: '4',
      p: { initial: '2', md: '4' },
      mt: '-2',
      className: 'custom-class',
      style: { color: 'red' },
    }

    const result = extractSpacingProps(props)

    // Should have className and style properties
    expect(result).toHaveProperty('className')
    expect(result).toHaveProperty('style')

    // className should include custom class if provided
    if (result.className) {
      expect(result.className).toContain('custom-class')
    }

    // style should be merged if provided
    if (result.style && typeof result.style === 'object') {
      expect(result.style).toHaveProperty('color', 'red')
    }

    // Should not have the spacing props in the result
    expect(result).not.toHaveProperty('m')
    expect(result).not.toHaveProperty('p')
    expect(result).not.toHaveProperty('mt')
  })

  test('extractSpacingProps handles empty props', () => {
    const props = {}
    const result = extractSpacingProps(props)

    expect(result).toBeDefined()
    // May or may not have className/style, but should not throw
  })
})
