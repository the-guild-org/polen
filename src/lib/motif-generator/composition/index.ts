/**
 * Composition and layout algorithms
 */

import type { SeededRandom } from '../core/random.ts'
import type { CompositionConfig, Shape } from '../core/types.ts'

/**
 * Layout engine for arranging shapes
 */
export class CompositionEngine {
  constructor(
    private config: CompositionConfig,
    private random: SeededRandom,
    private size: number,
  ) {}

  /**
   * Arrange shapes according to composition rules
   */
  arrange(shapes: Shape[]): Shape[] {
    let arranged = [...shapes]

    // Apply style-specific layout
    arranged = this.applyStyle(arranged)

    // Apply symmetry
    if (this.config.symmetry !== 'none') {
      arranged = this.applySymmetry(arranged)
    }

    // Apply density adjustments
    arranged = this.adjustDensity(arranged)

    // Apply overlap rules
    arranged = this.adjustOverlap(arranged)

    // Ensure all shapes are within bounds
    arranged = this.ensureWithinBounds(arranged)

    return arranged
  }

  private applyStyle(shapes: Shape[]): Shape[] {
    switch (this.config.style) {
      case 'geometric':
        return this.layoutGeometric(shapes)
      case 'organic':
        return this.layoutOrganic(shapes)
      case 'minimal':
        return this.layoutMinimal(shapes)
      case 'constellation':
        return this.layoutConstellation(shapes)
      case 'grid':
        return this.layoutGrid(shapes)
      case 'mandala':
        return this.layoutMandala(shapes)
      case 'flow':
        return this.layoutFlow(shapes)
      case 'crystalline':
        return this.layoutCrystalline(shapes)
      case 'abstract':
      default:
        return shapes // No specific layout
    }
  }

  private layoutGeometric(shapes: Shape[]): Shape[] {
    // Align to invisible grid
    const gridSize = this.size / 8

    return shapes.map(shape => ({
      ...shape,
      x: Math.round(shape.x / gridSize) * gridSize,
      y: Math.round(shape.y / gridSize) * gridSize,
      rotation: Math.round(shape.rotation / 45) * 45, // 45-degree increments
    }))
  }

  private layoutOrganic(shapes: Shape[]): Shape[] {
    // Add flow and curves
    const center = this.size / 2

    return shapes.map((shape, i) => {
      const angle = (i / shapes.length) * Math.PI * 2
      const radius = this.random.noise(angle * 2) * this.size * 0.3
      const flowX = Math.cos(angle) * radius
      const flowY = Math.sin(angle) * radius

      return {
        ...shape,
        x: shape.x + flowX * 0.3,
        y: shape.y + flowY * 0.3,
        rotation: angle * 180 / Math.PI + this.random.range(-30, 30),
      }
    })
  }

  private layoutMinimal(shapes: Shape[]): Shape[] {
    // For minimal style, we don't reduce shapes here since density is already applied
    // Just arrange them with increased spacing
    const spacing = this.size / (shapes.length + 1)

    return shapes.map((shape, i) => ({
      ...shape,
      x: spacing * (i + 1),
      y: this.size / 2 + this.random.range(-spacing / 4, spacing / 4),
    }))
  }

  private layoutConstellation(shapes: Shape[]): Shape[] {
    // Connect shapes like stars
    const nodes = shapes.filter(s => s.type === 'circle' || s.type === 'star')
    const connections = shapes.filter(s => s.type === 'line')

    // Position nodes
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2
      const radius = this.random.range(this.size * 0.2, this.size * 0.4)
      node.x = this.size / 2 + Math.cos(angle) * radius
      node.y = this.size / 2 + Math.sin(angle) * radius
    })

    // Create connections between nearby nodes
    for (let i = 0; i < connections.length && i < nodes.length - 1; i++) {
      const from = nodes[i]
      const to = nodes[(i + 1 + this.random.int(1, 2)) % nodes.length]
      const connection = connections[i]
      if (from && to && connection) {
        connection.x = (from.x + to.x) / 2
        connection.y = (from.y + to.y) / 2
        connection.width = Math.hypot(to.x - from.x, to.y - from.y)
        connection.rotation = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI
      }
    }

    return [...nodes, ...connections]
  }

  private layoutGrid(shapes: Shape[]): Shape[] {
    const cols = Math.ceil(Math.sqrt(shapes.length))
    const rows = Math.ceil(shapes.length / cols)
    const cellWidth = this.size / cols
    const cellHeight = this.size / rows

    return shapes.map((shape, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)

      return {
        ...shape,
        x: cellWidth * (col + 0.5),
        y: cellHeight * (row + 0.5),
        width: Math.min(shape.width, cellWidth * 0.8),
        height: Math.min(shape.height, cellHeight * 0.8),
      }
    })
  }

  private layoutMandala(shapes: Shape[]): Shape[] {
    const center = this.size / 2
    const rings = Math.ceil(Math.sqrt(shapes.length))

    return shapes.map((shape, i) => {
      const ring = Math.floor(i / 8) + 1
      const angleIndex = i % 8
      const angle = (angleIndex / 8) * Math.PI * 2
      const radius = (ring / rings) * this.size * 0.4

      return {
        ...shape,
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
        rotation: angle * 180 / Math.PI,
      }
    })
  }

  private layoutFlow(shapes: Shape[]): Shape[] {
    // Flowing river-like pattern
    const amplitude = this.size * 0.3
    const frequency = 3

    return shapes.map((shape, i) => {
      const t = i / shapes.length
      const x = t * this.size
      const y = this.size / 2 + Math.sin(t * Math.PI * frequency) * amplitude * this.random.noise(t * 5)

      return {
        ...shape,
        x,
        y,
        rotation: Math.cos(t * Math.PI * frequency) * 45,
      }
    })
  }

  private layoutCrystalline(shapes: Shape[]): Shape[] {
    // Angular, sharp arrangements
    const center = this.size / 2

    return shapes.map((shape, i) => {
      const layer = Math.floor(i / 6)
      const angleIndex = i % 6
      const angle = (angleIndex / 6) * Math.PI * 2
      const radius = layer * this.size * 0.15

      return {
        ...shape,
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
        rotation: angle * 180 / Math.PI,
        type: shape.type === 'circle' ? 'polygon' : shape.type, // Force angular shapes
      }
    })
  }

  private applySymmetry(shapes: Shape[]): Shape[] {
    const center = this.size / 2
    const mirrored: Shape[] = []

    for (const shape of shapes) {
      mirrored.push(shape)

      switch (this.config.symmetry) {
        case 'horizontal':
          mirrored.push({
            ...shape,
            x: this.size - shape.x,
          })
          break

        case 'vertical':
          mirrored.push({
            ...shape,
            y: this.size - shape.y,
          })
          break

        case 'bilateral':
          mirrored.push(
            { ...shape, x: this.size - shape.x },
            { ...shape, y: this.size - shape.y },
            { ...shape, x: this.size - shape.x, y: this.size - shape.y },
          )
          break

        case 'radial':
          for (let i = 1; i < 4; i++) {
            const angle = (i * 90) * Math.PI / 180
            const dx = shape.x - center
            const dy = shape.y - center
            const x = center + dx * Math.cos(angle) - dy * Math.sin(angle)
            const y = center + dx * Math.sin(angle) + dy * Math.cos(angle)
            mirrored.push({
              ...shape,
              x,
              y,
              rotation: shape.rotation + i * 90,
            })
          }
          break

        case 'rotational':
          const segments = 6
          for (let i = 1; i < segments; i++) {
            const angle = (i * 360 / segments) * Math.PI / 180
            const dx = shape.x - center
            const dy = shape.y - center
            const x = center + dx * Math.cos(angle) - dy * Math.sin(angle)
            const y = center + dx * Math.sin(angle) + dy * Math.cos(angle)
            mirrored.push({
              ...shape,
              x,
              y,
              rotation: shape.rotation + i * (360 / segments),
            })
          }
          break
      }
    }

    return mirrored
  }

  private adjustDensity(shapes: Shape[]): Shape[] {
    // For logo marks, we don't want to reduce shapes further
    // The density is already handled in the shape generation phase
    return shapes
  }

  private adjustOverlap(shapes: Shape[]): Shape[] {
    if (this.config.overlap === 0) {
      // No overlap allowed - spread shapes out
      return this.preventOverlap(shapes)
    }

    if (this.config.overlap === 1) {
      // Maximum overlap - cluster shapes
      return this.clusterShapes(shapes)
    }

    // Partial overlap is default behavior
    return shapes
  }

  private preventOverlap(shapes: Shape[]): Shape[] {
    const adjusted = [...shapes]
    const iterations = 10

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < adjusted.length; i++) {
        for (let j = i + 1; j < adjusted.length; j++) {
          const a = adjusted[i]
          const b = adjusted[j]
          if (a && b) {
            const dx = b.x - a.x
            const dy = b.y - a.y
            const distance = Math.hypot(dx, dy)
            const minDistance = (a.width + b.width) / 2

            if (distance < minDistance) {
              const push = (minDistance - distance) / 2
              const angle = Math.atan2(dy, dx)
              a.x -= Math.cos(angle) * push
              a.y -= Math.sin(angle) * push
              b.x += Math.cos(angle) * push
              b.y += Math.sin(angle) * push
            }
          }
        }
      }
    }

    return adjusted
  }

  private clusterShapes(shapes: Shape[]): Shape[] {
    const center = this.size / 2
    const clusterRadius = this.size * 0.3

    return shapes.map(shape => ({
      ...shape,
      x: center + this.random.range(-clusterRadius, clusterRadius),
      y: center + this.random.range(-clusterRadius, clusterRadius),
    }))
  }

  private ensureWithinBounds(shapes: Shape[]): Shape[] {
    return shapes.map(shape => {
      const halfWidth = shape.width / 2
      const halfHeight = shape.height / 2

      // Calculate bounds
      let minX = shape.x - halfWidth
      let maxX = shape.x + halfWidth
      let minY = shape.y - halfHeight
      let maxY = shape.y + halfHeight

      // Adjust position if out of bounds
      if (minX < 0) {
        shape.x += -minX
      } else if (maxX > this.size) {
        shape.x -= maxX - this.size
      }

      if (minY < 0) {
        shape.y += -minY
      } else if (maxY > this.size) {
        shape.y -= maxY - this.size
      }

      // Double-check and clamp if still out of bounds
      shape.x = Math.max(halfWidth, Math.min(this.size - halfWidth, shape.x))
      shape.y = Math.max(halfHeight, Math.min(this.size - halfHeight, shape.y))

      return shape
    })
  }
}

/**
 * Create composition engine with defaults
 */
export function createCompositionEngine(
  config: Partial<CompositionConfig> = {},
  random: SeededRandom,
  size: number,
): CompositionEngine {
  const fullConfig: CompositionConfig = {
    density: config.density ?? 0.6,
    overlap: config.overlap ?? 0.5,
    symmetry: config.symmetry || 'none',
    layers: config.layers ?? 3,
    style: config.style || 'abstract',
  }

  return new CompositionEngine(fullConfig, random, size)
}
