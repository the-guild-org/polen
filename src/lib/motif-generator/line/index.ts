/**
 * Line-based motif generation engine
 * Creates continuous meandering paths like an etch-a-sketch
 */

import type { SeededRandom } from '../core/random.ts'
import type { HSLColor } from '../core/types.ts'

/**
 * Point in 2D space
 */
export interface Point {
  x: number
  y: number
}

/**
 * Line segment with variable thickness
 */
export interface LineSegment {
  start: Point
  end: Point
  thickness: number
  curve?: {
    control1: Point
    control2: Point
  }
}

/**
 * Configuration for line generation
 */
export interface LineConfig {
  /**
   * Base line thickness
   */
  thickness: number
  /**
   * Thickness variation (0 = uniform, 1 = highly variable)
   */
  thicknessVariation: number
  /**
   * How often the line changes direction (0 = never, 1 = constantly)
   */
  turnFrequency: number
  /**
   * Range of turn angles in degrees [min, max]
   */
  turnAngles: [number, number]
  /**
   * Prefer smooth curves over sharp corners (0 = sharp, 1 = smooth)
   */
  smoothness: number
  /**
   * Path complexity (0 = simple, 1 = intricate)
   */
  complexity: number
  /**
   * Whether to fill enclosed spaces
   */
  fillEnclosed: boolean
  /**
   * Minimum path length as percentage of canvas diagonal
   */
  minLength: number
}

/**
 * Enclosed region detected in the path
 */
export interface EnclosedRegion {
  points: Point[]
  area: number
  centroid: Point
}

/**
 * Complete line path with metadata
 */
export interface LinePath {
  segments: LineSegment[]
  totalLength: number
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
  enclosedRegions: EnclosedRegion[]
}

/**
 * Line generator class
 */
export class LineGenerator {
  private random: SeededRandom
  private size: number
  private config: LineConfig

  constructor(random: SeededRandom, size: number, config: Partial<LineConfig> = {}) {
    this.random = random
    this.size = size
    this.config = {
      thickness: 3,
      thicknessVariation: 0.3,
      turnFrequency: 0.3,
      turnAngles: [30, 120],
      smoothness: 0.7,
      complexity: 0.5,
      fillEnclosed: true,
      minLength: 2, // Minimum 2x canvas diagonal
      ...config,
    }
  }

  /**
   * Generate a continuous line path
   */
  generate(): LinePath {
    const segments: LineSegment[] = []
    const margin = this.size * 0.1
    const effectiveSize = this.size - margin * 2

    // Start from a random point
    let currentPoint: Point = {
      x: margin + this.random.next() * effectiveSize,
      y: margin + this.random.next() * effectiveSize,
    }

    // Initial direction
    let currentAngle = this.random.next() * Math.PI * 2
    let currentThickness = this.config.thickness

    // Calculate target path length based on complexity
    const diagonal = Math.sqrt(this.size * this.size * 2)
    const targetLength = diagonal * (this.config.minLength + this.config.complexity * 3)
    let totalLength = 0

    // Track visited areas to avoid too much overlap
    const visitedGrid = this.createVisitedGrid()

    // Generate path segments
    while (totalLength < targetLength) {
      // Decide segment length based on complexity
      const segmentLength = this.size * (0.05 + (1 - this.config.complexity) * 0.15)

      // Decide if we should turn
      if (this.random.next() < this.config.turnFrequency) {
        const [minAngle, maxAngle] = this.config.turnAngles
        const turnAngle = (minAngle + this.random.next() * (maxAngle - minAngle)) * Math.PI / 180
        // Turn left or right randomly
        currentAngle += this.random.next() < 0.5 ? turnAngle : -turnAngle
      }

      // Calculate next point
      let nextPoint: Point = {
        x: currentPoint.x + Math.cos(currentAngle) * segmentLength,
        y: currentPoint.y + Math.sin(currentAngle) * segmentLength,
      }

      // Bounce off boundaries
      if (nextPoint.x < margin || nextPoint.x > this.size - margin) {
        currentAngle = Math.PI - currentAngle
        nextPoint = {
          x: Math.max(margin, Math.min(this.size - margin, nextPoint.x)),
          y: currentPoint.y + Math.sin(currentAngle) * segmentLength,
        }
      }
      if (nextPoint.y < margin || nextPoint.y > this.size - margin) {
        currentAngle = -currentAngle
        nextPoint = {
          x: currentPoint.x + Math.cos(currentAngle) * segmentLength,
          y: Math.max(margin, Math.min(this.size - margin, nextPoint.y)),
        }
      }

      // Vary thickness
      if (this.config.thicknessVariation > 0) {
        const variation = 1 + (this.random.next() - 0.5) * this.config.thicknessVariation
        currentThickness = this.config.thickness * variation
      }

      // Create segment
      const segment: LineSegment = {
        start: { ...currentPoint },
        end: nextPoint,
        thickness: currentThickness,
      }

      // Add curve control points for smooth lines
      if (this.config.smoothness > 0 && this.random.next() < this.config.smoothness) {
        const curveOffset = segmentLength * 0.3
        segment.curve = {
          control1: {
            x: currentPoint.x + Math.cos(currentAngle - 0.5) * curveOffset,
            y: currentPoint.y + Math.sin(currentAngle - 0.5) * curveOffset,
          },
          control2: {
            x: nextPoint.x + Math.cos(currentAngle + Math.PI + 0.5) * curveOffset,
            y: nextPoint.y + Math.sin(currentAngle + Math.PI + 0.5) * curveOffset,
          },
        }
      }

      segments.push(segment)

      // Update position
      currentPoint = nextPoint
      totalLength += segmentLength

      // Mark area as visited
      this.markVisited(visitedGrid, currentPoint)

      // Sometimes jump to unvisited areas for more interesting patterns
      if (this.config.complexity > 0.5 && this.random.next() < 0.1) {
        const unvisitedPoint = this.findUnvisitedArea(visitedGrid)
        if (unvisitedPoint) {
          currentPoint = unvisitedPoint
          currentAngle = this.random.next() * Math.PI * 2
        }
      }
    }

    // Calculate bounds
    const bounds = this.calculateBounds(segments)

    // Detect enclosed regions
    const enclosedRegions = this.config.fillEnclosed ? this.detectEnclosedRegions(segments) : []

    return {
      segments,
      totalLength,
      bounds,
      enclosedRegions,
    }
  }

  /**
   * Generate multiple interweaving line paths
   */
  generateMultiple(count: number): LinePath[] {
    const paths: LinePath[] = []

    for (let i = 0; i < count; i++) {
      // Vary configuration slightly for each path
      const config = { ...this.config }
      if (i > 0) {
        config.thickness = this.config.thickness * Math.pow(0.8, i) // Progressive thinning
        config.complexity = Math.min(this.config.complexity * Math.pow(1.2, i), 1) // Cap at 1
        config.thicknessVariation = this.config.thicknessVariation * 0.8 // Less variation for thinner lines
      }

      const generator = new LineGenerator(this.random, this.size, config)
      paths.push(generator.generate())
    }

    return paths
  }

  /**
   * Convert line path to SVG path string
   */
  static toSVGPath(path: LinePath): string {
    if (path.segments.length === 0) return ''

    const commands: string[] = []
    const firstSegment = path.segments[0]
    commands.push(`M ${firstSegment.start.x} ${firstSegment.start.y}`)

    for (const segment of path.segments) {
      if (segment.curve) {
        commands.push(
          `C ${segment.curve.control1.x} ${segment.curve.control1.y}, `
            + `${segment.curve.control2.x} ${segment.curve.control2.y}, `
            + `${segment.end.x} ${segment.end.y}`,
        )
      } else {
        commands.push(`L ${segment.end.x} ${segment.end.y}`)
      }
    }

    return commands.join(' ')
  }

  /**
   * Convert line path to SVG with variable stroke width
   */
  static toSVGWithVariableWidth(path: LinePath, color: HSLColor): string {
    const pathData = this.toSVGPath(path)
    const avgThickness = path.segments.reduce((sum, seg) => sum + seg.thickness, 0) / path.segments.length

    return `<path
      d="${pathData}"
      fill="none"
      stroke="hsl(${color.h}, ${color.s}%, ${color.l}%)"
      stroke-width="${avgThickness}"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="${color.a ?? 1}"
    />`
  }

  /**
   * Create a grid to track visited areas
   */
  private createVisitedGrid(): boolean[][] {
    const gridSize = 20 // 20x20 grid
    return Array(gridSize).fill(null).map(() => Array(gridSize).fill(false))
  }

  /**
   * Mark a point as visited in the grid
   */
  private markVisited(grid: boolean[][], point: Point): void {
    const gridSize = grid.length
    const x = Math.floor((point.x / this.size) * gridSize)
    const y = Math.floor((point.y / this.size) * gridSize)

    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      const row = grid[y]
      if (row) {
        row[x] = true
      }
    }
  }

  /**
   * Find an unvisited area to jump to
   */
  private findUnvisitedArea(grid: boolean[][]): Point | null {
    const gridSize = grid.length
    const unvisited: Point[] = []

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const row = grid[y]
        if (row && !row[x]) {
          unvisited.push({
            x: (x + 0.5) * this.size / gridSize,
            y: (y + 0.5) * this.size / gridSize,
          })
        }
      }
    }

    if (unvisited.length === 0) return null
    const selected = unvisited[Math.floor(this.random.next() * unvisited.length)]
    return selected ?? null
  }

  /**
   * Calculate bounds of the path
   */
  private calculateBounds(segments: LineSegment[]): LinePath['bounds'] {
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity

    for (const segment of segments) {
      minX = Math.min(minX, segment.start.x, segment.end.x)
      minY = Math.min(minY, segment.start.y, segment.end.y)
      maxX = Math.max(maxX, segment.start.x, segment.end.x)
      maxY = Math.max(maxY, segment.start.y, segment.end.y)

      if (segment.curve) {
        minX = Math.min(minX, segment.curve.control1.x, segment.curve.control2.x)
        minY = Math.min(minY, segment.curve.control1.y, segment.curve.control2.y)
        maxX = Math.max(maxX, segment.curve.control1.x, segment.curve.control2.x)
        maxY = Math.max(maxY, segment.curve.control1.y, segment.curve.control2.y)
      }
    }

    return { minX, minY, maxX, maxY }
  }

  /**
   * Detect enclosed regions in the path
   */
  private detectEnclosedRegions(segments: LineSegment[]): EnclosedRegion[] {
    // Simplified implementation - in a real implementation, we'd use
    // computational geometry algorithms to detect self-intersections
    // and enclosed areas
    const regions: EnclosedRegion[] = []

    // For now, create synthetic enclosed regions based on path density
    if (segments.length > 20 && this.random.next() < 0.7) {
      // Create 1-3 enclosed regions
      const regionCount = 1 + Math.floor(this.random.next() * 2)

      for (let i = 0; i < regionCount; i++) {
        const centerIdx = Math.floor(this.random.next() * segments.length * 0.8)
        const segment = segments[centerIdx]
        if (!segment) continue
        const center = segment.start

        // Create a small enclosed region around this point
        const radius = this.size * (0.05 + this.random.next() * 0.1)
        const points: Point[] = []
        const pointCount = 6 + Math.floor(this.random.next() * 4)

        for (let j = 0; j < pointCount; j++) {
          const angle = (j / pointCount) * Math.PI * 2
          const r = radius * (0.8 + this.random.next() * 0.4)
          points.push({
            x: center.x + Math.cos(angle) * r,
            y: center.y + Math.sin(angle) * r,
          })
        }

        // Calculate area (simplified)
        const area = Math.PI * radius * radius

        regions.push({
          points,
          area,
          centroid: center,
        })
      }
    }

    return regions
  }
}

/**
 * Create a line generator instance
 */
export function createLineGenerator(
  random: SeededRandom,
  size: number,
  config?: Partial<LineConfig>,
): LineGenerator {
  return new LineGenerator(random, size, config)
}
