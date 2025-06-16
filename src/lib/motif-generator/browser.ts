/**
 * Browser-compatible version of the motif generator
 * This excludes Node.js-specific features like file system access
 */

import { createAnimationGenerator } from './animations/index.ts'
import { createColorGenerator } from './colors/index.ts'
import { hslToString } from './colors/index.ts'
import { createCompositionEngine } from './composition/index.ts'
import { SeededRandom } from './core/random.ts'
import type { GenerateOptions, Motif, MotifConfig } from './core/types.ts'
import { createEffectsGenerator } from './effects/index.ts'
import { createShapeGenerator, shapeToSVG } from './shapes/index.ts'

/**
 * Simple hash function for browser
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Browser-safe default config
 */
const defaultConfig: MotifConfig = {
  colors: {
    mode: 'any',
    anchors: undefined,
    saturation: [40, 80],
    lightness: [30, 70],
  },
  shapes: {
    curves: 0.5,
    points: [3, 8],
  },
  composition: {
    style: 'abstract',
    density: 0.5,
    overlap: 0.3,
    symmetry: 'none',
    layers: 3,
  },
  animations: {
    pattern: null,
    targets: ['opacity'],
    duration: 4,
    easing: 'ease-in-out',
    respectReducedMotion: true,
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
  },
  variants: {
    favicon: {
      sizes: [32],
      simplified: true,
    },
    logo: {
      sizes: { default: 100 },
      responsive: false,
    },
  },
  accessibility: {
    highContrast: false,
    reduceMotion: true,
    colorBlindSafe: false,
  },
}

/**
 * Merge configs recursively
 */
function mergeConfig(base: MotifConfig, override?: Partial<MotifConfig>): MotifConfig {
  if (!override) return base

  const result = { ...base }

  for (const key in override) {
    const k = key as keyof MotifConfig
    if (override[k] !== undefined) {
      if (typeof override[k] === 'object' && !Array.isArray(override[k])) {
        result[k] = { ...base[k], ...override[k] } as any
      } else {
        result[k] = override[k] as any
      }
    }
  }

  return result
}

/**
 * Generate a motif (browser-safe version)
 */
export async function generateMotif(options: GenerateOptions): Promise<Motif> {
  const { seed, size = 100, darkMode = false, config: userConfig } = options

  // Merge configs
  const config = mergeConfig(defaultConfig, userConfig)

  // Create random generator
  const random = new SeededRandom(seed || Date.now().toString())

  // Generate shapes
  const shapes = generateShapes(config, random, size, darkMode)

  // Render SVG
  const svg = renderSVG(shapes, config, random, size)
  const css = generateCSS(shapes, config, random)

  return {
    svg,
    css,
    metadata: {
      seed: seed || Date.now().toString(),
      timestamp: Date.now(),
      config,
      shapes,
    },
  }
}

function generateShapes(
  config: MotifConfig,
  random: SeededRandom,
  size: number,
  darkMode: boolean,
) {
  const shapes: any[] = []

  // Initialize generators
  const colorGen = createColorGenerator(config.colors!, random)
  const shapeGen = createShapeGenerator(config.shapes!, random, size)
  const composition = createCompositionEngine(config.composition!, random, size)

  // Calculate shape count based on density and layers
  const compositionConfig = config.composition!
  const density = compositionConfig.density ?? 0.5
  const layers = compositionConfig.layers ?? 3
  const baseCount = Math.floor(5 + density * 10)
  const totalCount = baseCount * layers

  // Generate colors
  const colors = colorGen.generate(Math.ceil(totalCount / 2), darkMode)

  // Generate shapes for each layer
  for (let layer = 0; layer < layers; layer++) {
    const layerShapes = Math.floor(totalCount / layers)

    for (let i = 0; i < layerShapes; i++) {
      const color = colors[i % colors.length]
      if (color) {
        const shape = shapeGen.generate(color, layer)
        shapes.push(shape)
      }
    }
  }

  // Apply composition rules
  return composition.arrange(shapes)
}

function renderSVG(
  shapes: any[],
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
  ${filterDefs ? `<defs>${filterDefs}</defs>` : ''}
  <g class="motif-content">
    ${shapesMarkup}
  </g>
</svg>`
}

function generateCSS(
  shapes: any[],
  config: MotifConfig,
  random: SeededRandom,
): string | undefined {
  const animGen = createAnimationGenerator(config.animations!, random)
  return animGen?.generateCSS(shapes)
}
