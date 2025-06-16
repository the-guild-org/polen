/**
 * Animation generation for motifs
 */

import { hslToString } from '../colors/index.ts'
import type { SeededRandom } from '../core/random.ts'
import type { AnimationConfig, AnimationPattern, AnimationTarget, Shape } from '../core/types.ts'

/**
 * CSS animation generator
 */
export class AnimationGenerator {
  private animationId: string

  constructor(
    private config: AnimationConfig,
    private random: SeededRandom,
  ) {
    this.animationId = `motif-${Date.now()}-${Math.floor(random.next() * 10000)}`
  }

  /**
   * Generate CSS animations
   */
  generateCSS(shapes: Shape[]): string {
    if (!this.config.pattern) return ''

    const animations: string[] = []
    const keyframes: string[] = []

    // Check if we have line-based shapes
    const hasLinePaths = shapes.some(s => s.type === 'path')

    // Generate keyframes for each target
    for (const target of this.config.targets) {
      const keyframeName = `${this.animationId}-${target}`
      keyframes.push(this.generateKeyframes(keyframeName, target, shapes))

      // Apply to shapes
      shapes.forEach((shape, i) => {
        const selector = shape.type === 'path' ? `.line-${i}` : `.shape-${i}`
        const animation = this.generateAnimation(keyframeName, target, i)
        animations.push(`${selector} { ${animation} }`)
      })
    }

    // Add line-specific animations
    if (hasLinePaths) {
      keyframes.push(this.generateLineDrawKeyframes())
      shapes.forEach((shape, i) => {
        if (shape.type === 'path') {
          const pathLength = shape.properties?.['segments']?.length * 50 || 1000
          animations.push(`.line-${i} {
            stroke-dasharray: ${pathLength};
            stroke-dashoffset: ${pathLength};
            animation: ${this.animationId}-draw 3s ease-in-out forwards;
          }`)
        }
      })
    }

    // Add reduced motion support
    const reducedMotion = this.config.respectReducedMotion !== false
      ? `
        @media (prefers-reduced-motion: reduce) {
          .motif-shape, .motif-line {
            animation: none !important;
          }
        }
      `
      : ''

    return `
      ${keyframes.join('\n')}
      ${animations.join('\n')}
      ${reducedMotion}
    `
  }

  private generateKeyframes(name: string, target: AnimationTarget, shapes: Shape[]): string {
    const pattern = this.config.pattern!

    switch (target) {
      case 'color':
        return this.generateColorKeyframes(name, pattern, shapes)
      case 'opacity':
        return this.generateOpacityKeyframes(name, pattern)
      case 'position':
        return this.generatePositionKeyframes(name, pattern)
      case 'scale':
        return this.generateScaleKeyframes(name, pattern)
      case 'rotation':
        return this.generateRotationKeyframes(name, pattern)
      case 'shape':
        return this.generateShapeKeyframes(name, pattern)
      default:
        return ''
    }
  }

  private generateColorKeyframes(name: string, pattern: AnimationPattern, shapes: Shape[]): string {
    const keyframes: string[] = []

    switch (pattern) {
      case 'wave':
        keyframes.push(
          `0%, 100% { fill: currentColor; }`,
          `25% { fill: color-mix(in hsl, currentColor, transparent 20%); }`,
          `75% { fill: color-mix(in hsl, currentColor, white 20%); }`,
        )
        break

      case 'tide':
        keyframes.push(
          `0%, 100% { fill: currentColor; }`,
          `50% { fill: color-mix(in hsl, currentColor, transparent 10%); }`,
        )
        break

      case 'stream':
        const hueShift = this.random.range(10, 30)
        keyframes.push(
          `0% { filter: hue-rotate(0deg); }`,
          `100% { filter: hue-rotate(${hueShift}deg); }`,
        )
        break

      case 'pulse':
        keyframes.push(
          `0%, 100% { fill: currentColor; }`,
          `50% { fill: color-mix(in hsl, currentColor, white 30%); }`,
        )
        break
    }

    return `@keyframes ${name} { ${keyframes.join(' ')} }`
  }

  private generateOpacityKeyframes(name: string, pattern: AnimationPattern): string {
    const keyframes: string[] = []

    switch (pattern) {
      case 'wave':
        keyframes.push(
          `0%, 100% { opacity: 1; }`,
          `50% { opacity: 0.3; }`,
        )
        break

      case 'tide':
        keyframes.push(
          `0%, 100% { opacity: 0.8; }`,
          `50% { opacity: 0.6; }`,
        )
        break

      case 'stream':
        keyframes.push(
          `0% { opacity: 0.4; }`,
          `50% { opacity: 0.8; }`,
          `100% { opacity: 0.4; }`,
        )
        break

      case 'pulse':
        keyframes.push(
          `0%, 100% { opacity: 0.6; }`,
          `50% { opacity: 1; }`,
        )
        break

      case 'float':
        keyframes.push(
          `0%, 100% { opacity: 0.7; }`,
          `33% { opacity: 0.5; }`,
          `66% { opacity: 0.9; }`,
        )
        break
    }

    return `@keyframes ${name} { ${keyframes.join(' ')} }`
  }

  private generatePositionKeyframes(name: string, pattern: AnimationPattern): string {
    const keyframes: string[] = []
    const distance = this.random.range(5, 15)

    switch (pattern) {
      case 'wave':
        keyframes.push(
          `0%, 100% { transform: translate(0, 0); }`,
          `25% { transform: translate(${distance}px, -${distance / 2}px); }`,
          `75% { transform: translate(-${distance}px, ${distance / 2}px); }`,
        )
        break

      case 'tide':
        keyframes.push(
          `0%, 100% { transform: translateY(0); }`,
          `50% { transform: translateY(${distance / 2}px); }`,
        )
        break

      case 'stream':
        keyframes.push(
          `0% { transform: translateX(-${distance}px); }`,
          `100% { transform: translateX(${distance}px); }`,
        )
        break

      case 'float':
        keyframes.push(
          `0%, 100% { transform: translate(0, 0); }`,
          `25% { transform: translate(${distance / 3}px, -${distance / 3}px); }`,
          `50% { transform: translate(-${distance / 3}px, -${distance / 2}px); }`,
          `75% { transform: translate(-${distance / 2}px, ${distance / 3}px); }`,
        )
        break
    }

    return `@keyframes ${name} { ${keyframes.join(' ')} }`
  }

  private generateScaleKeyframes(name: string, pattern: AnimationPattern): string {
    const keyframes: string[] = []

    switch (pattern) {
      case 'wave':
        keyframes.push(
          `0%, 100% { transform: scale(1); }`,
          `50% { transform: scale(1.3); }`,
        )
        break

      case 'tide':
        keyframes.push(
          `0%, 100% { transform: scale(1); }`,
          `50% { transform: scale(1.1); }`,
        )
        break

      case 'pulse':
        keyframes.push(
          `0%, 100% { transform: scale(0.95); }`,
          `50% { transform: scale(1.05); }`,
        )
        break

      case 'morph':
        keyframes.push(
          `0%, 100% { transform: scale(1, 1); }`,
          `25% { transform: scale(1.1, 0.9); }`,
          `50% { transform: scale(0.9, 1.1); }`,
          `75% { transform: scale(1.05, 1.05); }`,
        )
        break
    }

    return `@keyframes ${name} { ${keyframes.join(' ')} }`
  }

  private generateRotationKeyframes(name: string, pattern: AnimationPattern): string {
    const keyframes: string[] = []

    switch (pattern) {
      case 'wave':
        keyframes.push(
          `0%, 100% { transform: rotate(0deg); }`,
          `25% { transform: rotate(15deg); }`,
          `75% { transform: rotate(-15deg); }`,
        )
        break

      case 'tide':
        keyframes.push(
          `0%, 100% { transform: rotate(0deg); }`,
          `50% { transform: rotate(5deg); }`,
        )
        break

      case 'stream':
      case 'rotate':
        keyframes.push(
          `0% { transform: rotate(0deg); }`,
          `100% { transform: rotate(360deg); }`,
        )
        break
    }

    return `@keyframes ${name} { ${keyframes.join(' ')} }`
  }

  private generateShapeKeyframes(name: string, pattern: AnimationPattern): string {
    // Shape morphing is complex - simplified version
    const keyframes: string[] = []

    switch (pattern) {
      case 'morph':
        keyframes.push(
          `0%, 100% { border-radius: 0%; }`,
          `50% { border-radius: 50%; }`,
        )
        break

      case 'wave':
        keyframes.push(
          `0%, 100% { border-radius: 10%; }`,
          `50% { border-radius: 30%; }`,
        )
        break
    }

    return `@keyframes ${name} { ${keyframes.join(' ')} }`
  }

  private generateLineDrawKeyframes(): string {
    return `@keyframes ${this.animationId}-draw {
      0% { stroke-dashoffset: var(--path-length, 1000); }
      100% { stroke-dashoffset: 0; }
    }`
  }

  private generateAnimation(keyframeName: string, target: AnimationTarget, index: number): string {
    const duration = this.getDuration(target)
    const delay = this.getDelay(index)
    const easing = this.config.easing || 'ease-in-out'

    return `animation: ${keyframeName} ${duration}s ${easing} ${delay}s infinite;`
  }

  private getDuration(target: AnimationTarget): number {
    const baseDuration = this.config.duration || 4

    // Vary duration by target and pattern
    const multipliers: Record<NonNullable<AnimationPattern>, number> = {
      wave: 1,
      tide: 1.5,
      stream: 2,
      pulse: 0.8,
      float: 2.5,
      morph: 1.2,
      rotate: 3,
    }

    const pattern = this.config.pattern || 'wave'
    return baseDuration * (pattern === null ? 1 : multipliers[pattern] || 1)
  }

  private getDelay(index: number): number {
    const pattern = this.config.pattern || 'wave'

    // Stagger animations based on pattern
    switch (pattern) {
      case 'wave':
        return index * 0.1
      case 'tide':
        return index * 0.05
      case 'stream':
        return this.random.range(0, 0.5)
      default:
        return 0
    }
  }
}

/**
 * Create animation generator
 */
export function createAnimationGenerator(
  config: Partial<AnimationConfig> = {},
  random: SeededRandom,
): AnimationGenerator | null {
  if (!config.pattern) return null

  const fullConfig: AnimationConfig = {
    pattern: config.pattern,
    targets: config.targets || ['opacity'],
    duration: config.duration,
    easing: config.easing || 'ease-in-out',
    respectReducedMotion: config.respectReducedMotion !== false,
  }

  return new AnimationGenerator(fullConfig, random)
}
