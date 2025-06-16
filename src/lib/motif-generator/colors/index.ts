/**
 * Color generation and manipulation utilities
 */

import type { SeededRandom } from '../core/random.ts'
import type { ColorPalette, HSLColor } from '../core/types.ts'

/**
 * Convert HSL to RGB hex string
 */
export function hslToHex(hsl: HSLColor): string {
  const { h, s, l } = hsl
  const a = s * Math.min(l, 100 - l) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color / 100).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/**
 * Convert HSL to CSS string
 */
export function hslToString(hsl: HSLColor): string {
  const alpha = hsl.a !== undefined ? ` / ${hsl.a}` : ''
  return `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%${alpha})`
}

/**
 * Adjust color for dark mode
 */
export function adjustForDarkMode(color: HSLColor): HSLColor {
  return {
    ...color,
    l: Math.min(90, color.l + 20),
    s: Math.min(100, color.s + 10),
  }
}

/**
 * Check if two colors have sufficient contrast (WCAG AA)
 */
export function hasContrast(color1: HSLColor, color2: HSLColor): boolean {
  const l1 = color1.l / 100
  const l2 = color2.l / 100
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  return ratio >= 4.5
}

/**
 * Generate color palette based on configuration
 */
export class ColorGenerator {
  private config: ColorPalette
  private random: SeededRandom
  constructor(config: ColorPalette, random: SeededRandom) {
    this.config = config
    this.random = random
  }

  /**
   * Generate a color palette
   */
  generate(count: number, darkMode = false): HSLColor[] {
    const colors: HSLColor[] = []
    const baseColors = this.generateBaseColors(count)

    for (const color of baseColors) {
      const adjusted = darkMode ? adjustForDarkMode(color) : color
      colors.push(adjusted)
    }

    // Ensure accessibility
    if (this.config.mode !== 'monochrome' && colors.length > 1) {
      this.ensureContrast(colors)
    }

    return colors
  }

  private generateBaseColors(count: number): HSLColor[] {
    switch (this.config.mode) {
      case 'monochrome':
        return this.generateMonochrome(count)
      case 'grayscale':
        return this.generateGrayscale(count)
      case 'duotone':
        return this.generateDuotone(count)
      case 'analogous':
        return this.generateAnalogous(count)
      case 'complementary':
        return this.generateComplementary(count)
      case 'triadic':
        return this.generateTriadic(count)
      case 'any':
      default:
        return this.generateAny(count)
    }
  }

  private generateMonochrome(count: number): HSLColor[] {
    const colors: HSLColor[] = []
    const [minL, maxL] = this.config.lightness || [10, 90]

    for (let i = 0; i < count; i++) {
      colors.push({
        h: 0,
        s: 0,
        l: this.random.range(minL, maxL),
      })
    }

    return colors
  }

  private generateGrayscale(count: number): HSLColor[] {
    const colors: HSLColor[] = []
    const [minL, maxL] = this.config.lightness || [20, 80]

    for (let i = 0; i < count; i++) {
      colors.push({
        h: 0,
        s: this.random.range(0, 10), // Slight tint
        l: this.random.range(minL, maxL),
      })
    }

    return colors
  }

  private generateDuotone(count: number): HSLColor[] {
    const baseHue = this.getAnchorHue()
    const secondHue = (baseHue + 180) % 360
    const colors: HSLColor[] = []

    for (let i = 0; i < count; i++) {
      const hue = this.random.bool() ? baseHue : secondHue
      colors.push(this.generateColorAround(hue))
    }

    return colors
  }

  private generateAnalogous(count: number): HSLColor[] {
    const baseHue = this.getAnchorHue()
    const colors: HSLColor[] = []
    const spread = 60 // Analogous colors are within 60 degrees

    for (let i = 0; i < count; i++) {
      const hue = (baseHue + this.random.range(-spread / 2, spread / 2) + 360) % 360
      colors.push(this.generateColorAround(hue))
    }

    return colors
  }

  private generateComplementary(count: number): HSLColor[] {
    const baseHue = this.getAnchorHue()
    const complementHue = (baseHue + 180) % 360
    const colors: HSLColor[] = []

    // Distribute colors between base and complement
    for (let i = 0; i < count; i++) {
      const useComplement = i % 2 === 1
      const hue = useComplement ? complementHue : baseHue
      colors.push(this.generateColorAround(hue, 20)) // Small variation
    }

    return colors
  }

  private generateTriadic(count: number): HSLColor[] {
    const baseHue = this.getAnchorHue()
    const hues = [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360]
    const colors: HSLColor[] = []

    for (let i = 0; i < count; i++) {
      const hue = hues[i % 3] ?? baseHue
      colors.push(this.generateColorAround(hue, 15))
    }

    return colors
  }

  private generateAny(count: number): HSLColor[] {
    const colors: HSLColor[] = []

    if (this.config.anchors && this.config.anchors.length > 0) {
      // Use anchors as guides
      for (let i = 0; i < count; i++) {
        const anchor = this.random.pick(this.config.anchors)
        colors.push(this.generateColorAround(anchor, 60))
      }
    } else {
      // Fully random
      for (let i = 0; i < count; i++) {
        const hue = this.random.range(0, 360)
        colors.push(this.generateColorAround(hue))
      }
    }

    return colors
  }

  private getAnchorHue(): number {
    if (this.config.anchors && this.config.anchors.length > 0) {
      return this.random.pick(this.config.anchors)
    }
    return this.random.range(0, 360)
  }

  private generateColorAround(hue: number, variation = 30): HSLColor {
    const [minS, maxS] = this.config.saturation || [40, 80]
    const [minL, maxL] = this.config.lightness || [30, 70]

    return {
      h: (hue + this.random.range(-variation, variation) + 360) % 360,
      s: this.random.range(minS, maxS),
      l: this.random.range(minL, maxL),
    }
  }

  private ensureContrast(colors: HSLColor[]): void {
    // Simple contrast adjustment - increase lightness differences
    if (colors.length < 2) return

    colors.sort((a, b) => a.l - b.l)
    const minDiff = 20

    for (let i = 1; i < colors.length; i++) {
      const current = colors[i]
      const previous = colors[i - 1]
      if (current && previous && current.l - previous.l < minDiff) {
        current.l = Math.min(100, previous.l + minDiff)
      }
    }
  }
}

/**
 * Create a color generator with defaults
 */
export function createColorGenerator(
  config: Partial<ColorPalette> = {},
  random: SeededRandom,
): ColorGenerator {
  const fullConfig: ColorPalette = {
    mode: config.mode || 'any',
    anchors: config.anchors,
    saturation: config.saturation || [40, 80],
    lightness: config.lightness || [30, 70],
    darkMode: config.darkMode || false,
  }

  return new ColorGenerator(fullConfig, random)
}
