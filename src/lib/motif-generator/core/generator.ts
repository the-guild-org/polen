/**
 * Main motif generator with line-based approach
 */

import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createAnimationGenerator } from '../animations/index.ts'
import { createColorGenerator, hslToString } from '../colors/index.ts'
import { createCompositionEngine } from '../composition/index.ts'
import { createEffectsGenerator } from '../effects/index.ts'
import { createLineGenerator, LineGenerator, type LinePath } from '../line/index.ts'
import { createRingGenerator } from '../rings/index.ts'
import { createShapeGenerator, shapeToSVG } from '../shapes/index.ts'
import { SeededRandom } from './random.ts'
import type { GenerateOptions, Motif, MotifConfig, Shape } from './types.ts'

/**
 * Default configuration values
 */
const defaultConfig: MotifConfig = {
  colors: {
    mode: 'any',
    saturation: [40, 80],
    lightness: [30, 70],
  },
  shapes: {
    curves: 0.5,
    points: [3, 8],
  },
  rings: {
    enabled: true, // Default to ring-based generation
    strokeWidth: 2, // Always thin strokes
    deformation: 0.15,
  },
  lineBased: {
    enabled: false,
    lineCount: 2,
    thickness: 3,
    thicknessVariation: 0.3,
    turnFrequency: 0.3,
    turnAngles: [30, 120],
    smoothness: 0.7,
    complexity: 0.5,
    fillEnclosed: true,
  },
  animations: {
    pattern: null,
    targets: ['opacity'],
  },
  composition: {
    density: 0.4,
    overlap: 0.3,
    symmetry: 'none',
    layers: 2,
    style: 'abstract',
  },
  effects: {
    grain: 0,
    blur: 0,
    glow: false,
    shadows: false,
  },
  regeneration: {
    onChange: 'refresh',
    persist: false,
    historyLimit: 100,
  },
  variants: {
    favicon: {
      sizes: [16, 32, 48],
      simplified: true,
    },
    logo: {
      sizes: { sm: 40, md: 60, lg: 100 },
      responsive: false,
    },
  },
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    colorBlindSafe: false,
  },
}

/**
 * Main motif generator class
 */
export class MotifGenerator {
  private config: MotifConfig

  constructor(config: Partial<MotifConfig> = {}) {
    this.config = this.mergeConfig(config)
  }

  /**
   * Generate a motif
   */
  async generate(options: GenerateOptions): Promise<Motif> {
    // Determine seed
    const seed = options.seed || this.generateSeed()
    const random = new SeededRandom(seed)

    // Merge config
    const config = options.config ? this.mergeConfig(options.config) : this.config

    // Handle persistence and regeneration
    if (config.regeneration?.onChange === 'refresh' && config.regeneration?.persist) {
      await this.saveToHistory(seed, options.size)
    }

    // Generate based on mode
    let svg: string
    let css: string | undefined
    let shapes: Shape[] = []

    if (config.rings?.enabled) {
      // Ring-based generation
      const result = this.generateRingBased(config, random, options.size, options.darkMode)
      svg = result.svg
      css = result.css
      shapes = result.shapes
    } else if (config.lineBased?.enabled) {
      // Line-based generation
      const result = this.generateLineBased(config, random, options.size, options.darkMode)
      svg = result.svg
      css = result.css
      shapes = result.shapes
    } else {
      // Traditional shape-based generation
      shapes = this.generateShapes(config, random, options.size, options.darkMode)
      svg = this.renderSVG(shapes, config, random, options.size)
      css = this.generateCSS(shapes, config, random)
    }

    return {
      svg,
      css,
      metadata: {
        seed,
        timestamp: Date.now(),
        config,
        shapes,
      },
    }
  }

  /**
   * Generate multiple variants
   */
  async generateVariants(baseOptions: Omit<GenerateOptions, 'size'>): Promise<Record<string, Motif>> {
    const variants: Record<string, Motif> = {}
    const config = baseOptions.config ? this.mergeConfig(baseOptions.config) : this.config

    // Generate favicon variants
    if (config.variants?.favicon) {
      for (const size of config.variants.favicon.sizes) {
        const simplified = size <= 32 && config.variants.favicon.simplified
        variants[`favicon-${size}`] = await this.generate({
          ...baseOptions,
          size,
          config: simplified ? this.simplifyConfig(config) : config,
        })
      }
    }

    // Generate logo variants
    if (config.variants?.logo) {
      for (const [name, size] of Object.entries(config.variants.logo.sizes)) {
        const variantConfig = config.variants.logo.responsive
          ? this.adjustConfigForSize(config, size)
          : config
        variants[`logo-${name}`] = await this.generate({
          ...baseOptions,
          size,
          config: variantConfig,
        })
      }
    }

    return variants
  }

  /**
   * Generate ring-based motif
   */
  private generateRingBased(
    config: MotifConfig,
    random: SeededRandom,
    size: number,
    darkMode?: boolean,
  ): { svg: string; css?: string; shapes: Shape[] } {
    const ringConfig = config.rings!
    const colorGen = createColorGenerator(config.colors!, random)
    const animationGen = createAnimationGenerator(config.animations!, random)
    const effectsGen = createEffectsGenerator(config.effects!, random)

    // Generate single color for all rings (monochrome)
    const colors = colorGen.generate(1, darkMode)
    const strokeColor = colors[0]

    // Generate the five rings
    const ringGenerator = createRingGenerator(random, ringConfig)
    const rings = ringGenerator.generateRings(size)

    // Build SVG
    const filterDefs = effectsGen?.generateFilters() || ''
    const filterRef = effectsGen?.getFilterRef() || ''

    const elements: string[] = []
    const shapes: Shape[] = []

    // Render rings
    rings.forEach((ring, index) => {
      const strokeColorStr = strokeColor ? hslToString(strokeColor) : '#000000'
      elements.push(`<path
        class="motif-ring ring-${index}"
        d="${ring.path}"
        stroke="${strokeColorStr}"
        stroke-width="${ring.strokeWidth}"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        ${filterRef ? `filter="${filterRef}"` : ''}
      />`)

      // Add to shapes for animation
      shapes.push({
        type: 'ring',
        x: size / 2,
        y: size / 2,
        width: size * 0.3,
        height: size * 0.3,
        rotation: 0,
        color: strokeColor || { h: 0, s: 0, l: 0 },
        opacity: 1,
        properties: {
          path: ring.path,
          strokeWidth: ring.strokeWidth,
        },
      })
    })

    // Generate SVG
    const svg = `<svg
      width="${size}"
      height="${size}"
      viewBox="0 0 ${size} ${size}"
      xmlns="http://www.w3.org/2000/svg"
      class="motif-svg motif-ring-based"
    >
    ${filterDefs}
    <g class="motif-content">
      ${elements.join('\n      ')}
    </g>
  </svg>`

    // Generate CSS animations
    const css = animationGen?.generateCSS(shapes) || ''

    return { svg, css, shapes }
  }

  /**
   * Generate line-based motif
   */
  private generateLineBased(
    config: MotifConfig,
    random: SeededRandom,
    size: number,
    darkMode?: boolean,
  ): { svg: string; css?: string; shapes: Shape[] } {
    const lineConfig = config.lineBased!
    const colorGen = createColorGenerator(config.colors!, random)
    const animationGen = createAnimationGenerator(config.animations!, random)
    const effectsGen = createEffectsGenerator(config.effects!, random)

    // Generate colors for lines and fills
    const lineCount = Math.min(Math.max(lineConfig.lineCount ?? 2, 1), 5)
    const colors = colorGen.generate(lineCount + 3, darkMode) // Extra colors for fills

    // Generate line paths
    const lineGenerator = createLineGenerator(random, size, {
      thickness: lineConfig.thickness,
      thicknessVariation: lineConfig.thicknessVariation,
      turnFrequency: lineConfig.turnFrequency,
      turnAngles: lineConfig.turnAngles,
      smoothness: lineConfig.smoothness,
      complexity: lineConfig.complexity,
      fillEnclosed: lineConfig.fillEnclosed,
    })

    const paths: LinePath[] = []

    // Generate primary line
    const primaryPath = lineGenerator.generate()
    paths.push(primaryPath)

    // Generate additional interweaving lines
    if (lineCount > 1) {
      const additionalPaths = lineGenerator.generateMultiple(lineCount - 1)
      paths.push(...additionalPaths)
    }

    // Build SVG
    const filterDefs = effectsGen?.generateFilters() || ''
    const filterRef = effectsGen?.getFilterRef() || ''

    const elements: string[] = []
    const shapes: Shape[] = []

    // Render filled regions first (background)
    paths.forEach((path, pathIndex) => {
      if (path.enclosedRegions.length > 0 && lineConfig.fillEnclosed) {
        path.enclosedRegions.forEach((region, regionIndex) => {
          const fillColor = colors[(pathIndex + regionIndex + lineCount) % colors.length]
          if (fillColor) {
            const points = region.points.map(p => `${p.x},${p.y}`).join(' ')
            elements.push(`<polygon
              class="motif-fill fill-${pathIndex}-${regionIndex}"
              points="${points}"
              fill="${hslToString(fillColor)}"
              opacity="${fillColor.a ?? 0.3}"
              ${filterRef ? `filter="${filterRef}"` : ''}
            />`)

            // Add to shapes for animation
            shapes.push({
              type: 'polygon',
              x: region.centroid.x,
              y: region.centroid.y,
              width: 0,
              height: 0,
              rotation: 0,
              color: fillColor,
              opacity: fillColor.a ?? 0.3,
              properties: { points: region.points },
            })
          }
        })
      }
    })

    // Render lines on top
    paths.forEach((path, index) => {
      const lineColor = colors[index % colors.length]
      if (lineColor) {
        const pathElement = LineGenerator.toSVGWithVariableWidth(path, lineColor)
        const wrappedPath = pathElement.replace(
          '<path',
          `<path class="motif-line line-${index}" ${filterRef ? `filter="${filterRef}"` : ''}`,
        )
        elements.push(wrappedPath)

        // Add line as shape for animation
        shapes.push({
          type: 'path',
          x: path.bounds.minX,
          y: path.bounds.minY,
          width: path.bounds.maxX - path.bounds.minX,
          height: path.bounds.maxY - path.bounds.minY,
          rotation: 0,
          color: lineColor,
          opacity: lineColor.a ?? 1,
          properties: {
            path: LineGenerator.toSVGPath(path),
            segments: path.segments,
          },
        })
      }
    })

    // Generate SVG
    const svg = `<svg
      width="${size}"
      height="${size}"
      viewBox="0 0 ${size} ${size}"
      xmlns="http://www.w3.org/2000/svg"
      class="motif-svg motif-line-based"
    >
    ${filterDefs}
    <g class="motif-content">
      ${elements.join('\n      ')}
    </g>
  </svg>`

    // Generate CSS animations
    const css = animationGen?.generateCSS(shapes) || ''

    return { svg, css, shapes }
  }

  /**
   * Generate traditional shape-based motif (fallback)
   */
  private generateShapes(
    config: MotifConfig,
    random: SeededRandom,
    size: number,
    darkMode?: boolean,
  ): Shape[] {
    const shapes: Shape[] = []

    // Initialize generators
    const colorGen = createColorGenerator(config.colors!, random)
    const shapeGen = createShapeGenerator(config.shapes!, random, size)
    const composition = createCompositionEngine(config.composition!, random, size)

    // Calculate shape count based on density and layers
    const compositionConfig = config.composition!
    const density = compositionConfig.density ?? 0.5
    const layers = compositionConfig.layers ?? 3
    const baseCount = Math.floor(3 + density * 4)
    const totalCount = Math.min(Math.max(baseCount, 3), 7) // Between 3-7 shapes

    // Generate colors
    const colors = colorGen.generate(Math.ceil(totalCount / 2), darkMode)

    // Generate shapes distributed across layers for visual depth
    for (let i = 0; i < totalCount; i++) {
      const color = colors[i % colors.length]
      if (color) {
        const layer = i % layers
        const shape = shapeGen.generate(color, layer)
        shapes.push(shape)
      }
    }

    // Apply composition rules
    return composition.arrange(shapes)
  }

  private renderSVG(
    shapes: Shape[],
    config: MotifConfig,
    random: SeededRandom,
    size: number,
  ): string {
    // Generate effects
    const effects = createEffectsGenerator(config.effects!, random)
    const filterDefs = effects?.generateFilters() || ''
    const filterRef = effects?.getFilterRef() || ''

    // Render shapes
    const shapesMarkup = shapes.map((shape, i) => {
      const transform = `translate(0, 0) rotate(${shape.rotation} ${shape.x} ${shape.y})`
      const fill = hslToString(shape.color)
      const shapeEl = shapeToSVG(shape)

      // Add classes and attributes
      const classNames = `motif-shape shape-${i}`

      // Wrap shape in a group with transformations
      return `<g class="${classNames}" transform="${transform}" fill="${fill}" opacity="${shape.opacity}" ${
        filterRef ? `filter="${filterRef}"` : ''
      }>
        ${shapeEl}
      </g>`
    }).join('\n    ')

    return `<svg
      width="${size}"
      height="${size}"
      viewBox="0 0 ${size} ${size}"
      xmlns="http://www.w3.org/2000/svg"
      class="motif-svg"
    >
    ${filterDefs}
    <g class="motif-content">
      ${shapesMarkup}
    </g>
  </svg>`
  }

  private generateCSS(shapes: Shape[], config: MotifConfig, random: SeededRandom): string {
    const animation = createAnimationGenerator(config.animations!, random)
    return animation?.generateCSS(shapes) || ''
  }

  private generateSeed(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16)
  }

  private async saveToHistory(seed: string, size: number): Promise<void> {
    const historyPath = this.config.regeneration?.historyPath || '.polen/generated'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `logo-${size}-${timestamp}-${seed.substring(0, 8)}.svg`

    try {
      await fs.mkdir(historyPath, { recursive: true })

      // Check history limit
      const files = await fs.readdir(historyPath)
      const limit = this.config.regeneration?.historyLimit || 100

      if (files.length >= limit) {
        // Remove oldest files
        const sorted = files.sort()
        const toRemove = sorted.slice(0, files.length - limit + 1)
        for (const file of toRemove) {
          await fs.unlink(path.join(historyPath, file))
        }
      }

      // Save will happen after generation
      // This is just to prepare the directory
    } catch (error) {
      console.warn('Failed to prepare history directory:', error)
    }
  }

  private mergeConfig(partial: Partial<MotifConfig>): MotifConfig {
    return {
      colors: { ...defaultConfig.colors, ...partial.colors },
      shapes: { ...defaultConfig.shapes, ...partial.shapes },
      rings: { ...defaultConfig.rings, ...partial.rings },
      lineBased: { ...defaultConfig.lineBased, ...partial.lineBased },
      animations: { ...defaultConfig.animations, ...partial.animations },
      composition: { ...defaultConfig.composition, ...partial.composition },
      effects: { ...defaultConfig.effects, ...partial.effects },
      regeneration: { ...defaultConfig.regeneration, ...partial.regeneration },
      variants: { ...defaultConfig.variants, ...partial.variants },
      accessibility: { ...defaultConfig.accessibility, ...partial.accessibility },
    }
  }

  private simplifyConfig(config: MotifConfig): MotifConfig {
    return {
      ...config,
      rings: {
        ...config.rings!,
        strokeWidth: 2,
        deformation: 0.05,
      },
      lineBased: {
        ...config.lineBased!,
        lineCount: 1,
        complexity: 0.2,
        fillEnclosed: false,
      },
      composition: {
        ...config.composition!,
        layers: 1,
        density: 0.3,
      },
      effects: {
        grain: 0,
        blur: 0,
        glow: false,
        shadows: false,
      },
      animations: {
        pattern: null,
        targets: [],
      },
    }
  }

  private adjustConfigForSize(config: MotifConfig, size: number): MotifConfig {
    const scale = size / 100 // Assuming 100 is base size

    return {
      ...config,
      rings: {
        ...config.rings!,
        strokeWidth: Array.isArray(config.rings?.strokeWidth)
          ? [(config.rings.strokeWidth[0] ?? 2) * scale, (config.rings.strokeWidth[1] ?? 4) * scale]
          : (config.rings?.strokeWidth ?? 3) * scale,
      },
      lineBased: {
        ...config.lineBased!,
        thickness: (config.lineBased?.thickness ?? 3) * scale,
        complexity: Math.min((config.lineBased?.complexity ?? 0.5) * scale, 1),
      },
      composition: {
        ...config.composition!,
        density: (config.composition?.density ?? 0.5) * scale,
        layers: Math.max(1, Math.floor((config.composition?.layers ?? 3) * scale)),
      },
      shapes: {
        ...config.shapes!,
        curves: config.shapes?.curves ?? 0.5,
      },
    }
  }
}

/**
 * Create a motif generator instance
 */
export function createMotifGenerator(config?: Partial<MotifConfig>): MotifGenerator {
  return new MotifGenerator(config)
}

/**
 * Generate a single motif (convenience function)
 */
export async function generateMotif(options: GenerateOptions): Promise<Motif> {
  const generator = new MotifGenerator(options.config)
  return generator.generate(options)
}
