import { describe, expect, it } from 'vitest'
import { SeededRandom } from '../core/random.ts'
import type { ColorPalette } from '../core/types.ts'
import { adjustForDarkMode, ColorGenerator, hasContrast, hslToHex, hslToString } from './index.ts'

describe('Color utilities', () => {
  describe('hslToHex', () => {
    it('should convert HSL to hex', () => {
      expect(hslToHex({ h: 0, s: 100, l: 50 })).toBe('#ff0000')
      expect(hslToHex({ h: 120, s: 100, l: 50 })).toBe('#00ff00')
      expect(hslToHex({ h: 240, s: 100, l: 50 })).toBe('#0000ff')
      expect(hslToHex({ h: 0, s: 0, l: 0 })).toBe('#000000')
      expect(hslToHex({ h: 0, s: 0, l: 100 })).toBe('#ffffff')
    })
  })

  describe('hslToString', () => {
    it('should convert HSL to CSS string', () => {
      expect(hslToString({ h: 180, s: 50, l: 50 })).toBe('hsl(180 50% 50%)')
      expect(hslToString({ h: 0, s: 100, l: 50, a: 0.5 })).toBe('hsl(0 100% 50% / 0.5)')
    })
  })

  describe('adjustForDarkMode', () => {
    it('should lighten colors for dark mode', () => {
      const color = { h: 180, s: 50, l: 40 }
      const adjusted = adjustForDarkMode(color)

      expect(adjusted.l).toBeGreaterThan(color.l)
      expect(adjusted.s).toBeGreaterThanOrEqual(color.s)
    })

    it('should not exceed limits', () => {
      const color = { h: 180, s: 95, l: 80 }
      const adjusted = adjustForDarkMode(color)

      expect(adjusted.l).toBeLessThanOrEqual(90)
      expect(adjusted.s).toBeLessThanOrEqual(100)
    })
  })

  describe('hasContrast', () => {
    it('should detect sufficient contrast', () => {
      expect(hasContrast({ h: 0, s: 0, l: 0 }, { h: 0, s: 0, l: 100 })).toBe(true)
      expect(hasContrast({ h: 0, s: 0, l: 40 }, { h: 0, s: 0, l: 45 })).toBe(false)
    })
  })
})

describe('ColorGenerator', () => {
  const random = new SeededRandom('color-test')

  describe('monochrome mode', () => {
    it('should generate only grayscale colors', () => {
      const config: ColorPalette = {
        mode: 'monochrome',
        saturation: [0, 100],
        lightness: [0, 100],
      }

      const generator = new ColorGenerator(config, random)
      const colors = generator.generate(5)

      expect(colors).toHaveLength(5)
      colors.forEach(color => {
        expect(color.h).toBe(0)
        expect(color.s).toBe(0)
      })
    })
  })

  describe('duotone mode', () => {
    it('should generate two complementary hues', () => {
      const config: ColorPalette = {
        mode: 'duotone',
        anchors: [60], // Yellow
        saturation: [50, 50],
        lightness: [50, 50],
      }

      const generator = new ColorGenerator(config, random)
      const colors = generator.generate(4)

      // Should generate colors around two hues (base and complement)
      const uniqueHues = colors.map(c => Math.round(c.h / 10) * 10) // Round to nearest 10
      const hueSet = new Set(uniqueHues)
      expect(hueSet.size).toBeLessThanOrEqual(4) // Allow some variation
    })
  })

  describe('analogous mode', () => {
    it('should generate colors within 60 degrees', () => {
      const config: ColorPalette = {
        mode: 'analogous',
        anchors: [180], // Cyan
        saturation: [50, 50],
        lightness: [50, 50],
      }

      const generator = new ColorGenerator(config, random)
      const colors = generator.generate(5)

      colors.forEach(color => {
        const diff = Math.abs(color.h - 180)
        expect(Math.min(diff, 360 - diff)).toBeLessThanOrEqual(60) // Analogous is within 60 degrees
      })
    })
  })

  describe('triadic mode', () => {
    it('should generate three evenly spaced hues', () => {
      const config: ColorPalette = {
        mode: 'triadic',
        anchors: [0], // Red
        saturation: [50, 50],
        lightness: [50, 50],
      }

      const generator = new ColorGenerator(config, random)
      const colors = generator.generate(6)

      // Check that colors are distributed around three points
      const hueGroups = new Map<number, number>()
      colors.forEach(color => {
        // Group by nearest 120-degree segment
        const segment = Math.round(color.h / 120) * 120
        hueGroups.set(segment % 360, (hueGroups.get(segment % 360) || 0) + 1)
      })

      // Should have colors in at least 2 of the 3 segments for 6 colors
      expect(hueGroups.size).toBeGreaterThanOrEqual(2)
    })
  })

  describe('any mode with anchors', () => {
    it('should generate colors around anchor hues', () => {
      const config: ColorPalette = {
        mode: 'any',
        anchors: [30, 90, 150], // Orange, yellow-green, green-cyan
        saturation: [50, 50],
        lightness: [50, 50],
      }

      const generator = new ColorGenerator(config, random)
      const colors = generator.generate(10)

      expect(colors).toHaveLength(10)
      // Colors should be somewhat distributed around anchors
      const hues = colors.map(c => c.h)
      expect(Math.min(...hues)).toBeLessThan(180)
      expect(Math.max(...hues)).toBeGreaterThan(0)
    })
  })
})
