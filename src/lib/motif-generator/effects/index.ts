/**
 * Visual effects for motifs
 */

import type { SeededRandom } from '../core/random.ts'
import type { EffectsConfig } from '../core/types.ts'

/**
 * Generate SVG filters for effects
 */
export class EffectsGenerator {
  private filterId: string
  private config: EffectsConfig
  private random: SeededRandom

  constructor(
    config: EffectsConfig,
    random: SeededRandom,
  ) {
    this.config = config
    this.random = random
    this.filterId = `motif-filter-${Date.now()}-${Math.floor(random.next() * 10000)}`
  }

  /**
   * Generate SVG filter definitions
   */
  generateFilters(): string {
    const filters: string[] = []

    if (this.config.grain > 0) {
      filters.push(this.generateGrainFilter())
    }

    if (this.config.blur > 0) {
      filters.push(this.generateBlurFilter())
    }

    if (this.config.glow) {
      filters.push(this.generateGlowFilter())
    }

    if (this.config.shadows) {
      filters.push(this.generateShadowFilter())
    }

    if (filters.length === 0) return ''

    return `
      <defs>
        ${filters.join('\n')}
        ${this.generateCompositeFilter(filters.length > 1)}
      </defs>
    `
  }

  /**
   * Get filter reference for shapes
   */
  getFilterRef(): string {
    return this.hasEffects() ? `url(#${this.filterId})` : ''
  }

  private hasEffects(): boolean {
    return this.config.grain > 0
      || this.config.blur > 0
      || this.config.glow
      || this.config.shadows
  }

  private generateGrainFilter(): string {
    const intensity = this.config.grain
    const scale = 1 + (1 - intensity) * 2 // Smaller grain for higher intensity

    return `
      <filter id="${this.filterId}-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="${0.9 / scale}"
          numOctaves="4"
          seed="${this.random.int(0, 1000)}"
        />
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="discrete" tableValues="0 .5 .5 .5 .5 1"/>
        </feComponentTransfer>
        <feComposite operator="over" in2="SourceGraphic">
          <animate
            attributeName="seed"
            values="0;100;0"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </feComposite>
        <feBlend mode="multiply" in2="SourceGraphic" result="grain"/>
        <feBlend mode="normal" in="grain" in2="SourceGraphic">
          <feFuncA type="table" tableValues="0 ${1 - intensity * 0.3}"/>
        </feBlend>
      </filter>
    `
  }

  private generateBlurFilter(): string {
    const amount = this.config.blur * 5 // Max 5px blur

    return `
      <filter id="${this.filterId}-blur">
        <feGaussianBlur stdDeviation="${amount}"/>
      </filter>
    `
  }

  private generateGlowFilter(): string {
    return `
      <filter id="${this.filterId}-glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `
  }

  private generateShadowFilter(): string {
    return `
      <filter id="${this.filterId}-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
        <feOffset dx="2" dy="2" result="offsetblur"/>
        <feFlood flood-color="#000000" flood-opacity="0.2"/>
        <feComposite in2="offsetblur" operator="in"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `
  }

  private generateCompositeFilter(hasMultiple: boolean): string {
    if (!hasMultiple) return ''

    const effects = []
    let lastResult = 'SourceGraphic'

    if (this.config.blur > 0) {
      effects.push(`<feGaussianBlur stdDeviation="${this.config.blur * 5}" result="blurred"/>`)
      lastResult = 'blurred'
    }

    if (this.config.shadows) {
      effects.push(`
        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
        <feOffset dx="2" dy="2" result="shadow"/>
        <feFlood flood-color="#000000" flood-opacity="0.2"/>
        <feComposite in2="shadow" operator="in" result="shadow2"/>
      `)
    }

    if (this.config.glow) {
      effects.push(`
        <feGaussianBlur in="${lastResult}" stdDeviation="3" result="glow"/>
        <feMerge result="glowed">
          <feMergeNode in="glow"/>
          <feMergeNode in="${lastResult}"/>
        </feMerge>
      `)
      lastResult = 'glowed'
    }

    return `
      <filter id="${this.filterId}" x="-50%" y="-50%" width="200%" height="200%">
        ${effects.join('\n')}
        ${
      this.config.shadows
        ? `
          <feMerge>
            <feMergeNode in="shadow2"/>
            <feMergeNode in="${lastResult}"/>
          </feMerge>
        `
        : ''
    }
      </filter>
    `
  }
}

/**
 * Create effects generator
 */
export function createEffectsGenerator(
  config: Partial<EffectsConfig> = {},
  random: SeededRandom,
): EffectsGenerator | null {
  const hasEffects = config.grain || config.blur || config.glow || config.shadows
  if (!hasEffects) return null

  const fullConfig: EffectsConfig = {
    grain: config.grain || 0,
    blur: config.blur || 0,
    glow: config.glow || false,
    shadows: config.shadows || false,
  }

  return new EffectsGenerator(fullConfig, random)
}
