/**
 * Shape generation utilities
 */

import type { SeededRandom } from '../core/random.ts'
import type { HSLColor, Shape, ShapeConfig, ShapeType } from '../core/types.ts'

/**
 * Shape generator class
 */
export class ShapeGenerator {
  private config: ShapeConfig
  private random: SeededRandom
  private size: number

  constructor(
    config: ShapeConfig,
    random: SeededRandom,
    size: number,
  ) {
    this.config = config
    this.random = random
    this.size = size
  }

  /**
   * Generate a random shape
   */
  generate(color: HSLColor, layer: number = 0): Shape {
    const type = this.selectShapeType()
    const position = this.generatePosition(layer)
    const dimensions = this.generateDimensions(type)

    return {
      type,
      x: position.x,
      y: position.y,
      width: dimensions.width,
      height: dimensions.height,
      rotation: this.random.range(0, 360),
      color,
      opacity: this.random.range(0.6, 0.9), // Higher opacity for clearer logo marks
      properties: this.generateProperties(type),
    }
  }

  private selectShapeType(): ShapeType {
    const curvePreference = this.config.curves

    // Weighted selection based on curve preference
    const shapeWeights: Record<ShapeType, number> = {
      circle: curvePreference,
      ellipse: curvePreference * 0.8,
      bezier: curvePreference * 0.6,
      rectangle: 1 - curvePreference,
      polygon: (1 - curvePreference) * 0.8,
      star: (1 - curvePreference) * 0.6,
      line: 0.2, // Always low probability
      path: 0, // Path is only used for line-based generation
    }

    // Normalize weights
    const totalWeight = Object.values(shapeWeights).reduce((a, b) => a + b, 0)
    const normalized = Object.entries(shapeWeights).map(([type, weight]) => ({
      type: type as ShapeType,
      weight: weight / totalWeight,
    }))

    // Random selection
    const r = this.random.next()
    let cumulative = 0

    for (const { type, weight } of normalized) {
      cumulative += weight
      if (r < cumulative) return type
    }

    return 'circle' // Fallback
  }

  private generatePosition(layer: number): { x: number; y: number } {
    // Layer influences position - higher layers more centered
    const centerBias = layer * 0.2
    // Keep shapes well within bounds to prevent cropping
    const margin = this.size * 0.2 // 20% margin from edges
    const range = this.size * (1 - centerBias) - margin * 2
    const offset = margin + this.size * centerBias / 2

    return {
      x: offset + this.random.range(0, range),
      y: offset + this.random.range(0, range),
    }
  }

  private generateDimensions(type: ShapeType): { width: number; height: number } {
    const minSize = this.size * 0.1
    const maxSize = this.size * 0.3 // Reduced from 0.5 to ensure shapes fit within bounds

    if (type === 'circle') {
      const radius = this.random.range(minSize, maxSize)
      return { width: radius, height: radius }
    }

    if (type === 'line') {
      return {
        width: this.random.range(minSize, maxSize),
        height: this.random.range(2, 5),
      }
    }

    return {
      width: this.random.range(minSize, maxSize),
      height: this.random.range(minSize, maxSize),
    }
  }

  private generateProperties(type: ShapeType): Record<string, any> {
    const properties: Record<string, any> = {}

    switch (type) {
      case 'polygon':
      case 'star':
        properties['points'] = this.generatePoints()
        if (type === 'star') {
          properties['innerRadius'] = this.random.range(0.3, 0.5)
        }
        break

      case 'rectangle':
        properties['cornerRadius'] = this.config.curves * this.random.range(0, 20)
        break

      case 'bezier':
        properties['controlPoints'] = this.generateBezierControls()
        break

      case 'ellipse':
        properties['eccentricity'] = this.random.range(0.3, 0.9)
        break
    }

    return properties
  }

  private generatePoints(): number {
    const { points } = this.config

    if (typeof points === 'number') {
      return points === Infinity ? this.random.int(3, 12) : points
    }

    return this.random.int(points[0], points[1])
  }

  private generateBezierControls(): Array<{ x: number; y: number }> {
    const count = this.random.int(2, 4)
    const controls = []

    for (let i = 0; i < count; i++) {
      controls.push({
        x: this.random.range(-50, 50),
        y: this.random.range(-50, 50),
      })
    }

    return controls
  }
}

/**
 * Convert shape to SVG path
 */
export function shapeToSVG(shape: Shape): string {
  const { type, x, y, width, height, rotation, properties } = shape

  let path = ''

  switch (type) {
    case 'circle':
      return `<circle cx="${x}" cy="${y}" r="${width / 2}" />`

    case 'ellipse':
      return `<ellipse cx="${x}" cy="${y}" rx="${width / 2}" ry="${height / 2}" />`

    case 'rectangle':
      const rx = properties['cornerRadius'] || 0
      return `<rect x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}" rx="${rx}" />`

    case 'polygon':
      path = generatePolygonPath(x, y, width / 2, properties['points'] as number)
      break

    case 'star':
      path = generateStarPath(x, y, width / 2, properties['points'] as number, properties['innerRadius'] as number)
      break

    case 'bezier':
      path = generateBezierPath(x, y, width, height, properties['controlPoints'] as Array<{ x: number; y: number }>)
      break

    case 'line':
      return `<line x1="${x - width / 2}" y1="${y}" x2="${x + width / 2}" y2="${y}" stroke-width="${height}" />`

    case 'path':
      // For line-based generation, path is stored in properties
      return properties['path'] ? `<path d="${properties['path']}" />` : ''
  }

  return `<path d="${path}" />`
}

function generatePolygonPath(cx: number, cy: number, radius: number, points: number): string {
  const angle = (Math.PI * 2) / points
  const coords = []

  for (let i = 0; i < points; i++) {
    const x = cx + radius * Math.cos(angle * i - Math.PI / 2)
    const y = cy + radius * Math.sin(angle * i - Math.PI / 2)
    coords.push(`${x},${y}`)
  }

  return `M ${coords.join(' L ')} Z`
}

function generateStarPath(
  cx: number,
  cy: number,
  outerRadius: number,
  points: number,
  innerRadiusRatio: number,
): string {
  const innerRadius = outerRadius * innerRadiusRatio
  const angle = Math.PI / points
  const coords = []

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const x = cx + radius * Math.cos(angle * i - Math.PI / 2)
    const y = cy + radius * Math.sin(angle * i - Math.PI / 2)
    coords.push(`${x},${y}`)
  }

  return `M ${coords.join(' L ')} Z`
}

function generateBezierPath(
  x: number,
  y: number,
  width: number,
  height: number,
  controls: Array<{ x: number; y: number }>,
): string {
  let path = `M ${x - width / 2} ${y}`

  const endX = x + width / 2
  const endY = y

  if (controls.length === 1) {
    // Quadratic bezier
    const c = controls[0]
    if (c) {
      path += ` Q ${x + c.x} ${y + c.y}, ${endX} ${endY}`
    }
  } else if (controls.length >= 2) {
    // Cubic bezier
    const c1 = controls[0]
    const c2 = controls[1]
    if (c1 && c2) {
      path += ` C ${x + c1.x} ${y + c1.y}, ${x + c2.x} ${y + c2.y}, ${endX} ${endY}`
    }
  }

  return path
}

/**
 * Create shape generator with defaults
 */
export function createShapeGenerator(
  config: Partial<ShapeConfig> = {},
  random: SeededRandom,
  size: number,
): ShapeGenerator {
  const fullConfig: ShapeConfig = {
    curves: config.curves ?? 0.5,
    points: config.points ?? [3, 8],
  }

  return new ShapeGenerator(fullConfig, random, size)
}
