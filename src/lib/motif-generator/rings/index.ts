/**
 * Ring-based motif generator
 * Creates logo marks using five overlapping rings with hand-drawn imperfections
 */

import { SeededRandom } from '../core/random.ts'

export interface RingConfig {
  strokeWidth?: number | [number, number] // Base stroke width or range
  deformation?: number // Deformation percentage (0-1)
}

export interface Ring {
  path: string
  strokeWidth: number
}

export class RingGenerator {
  private random: SeededRandom
  private config: RingConfig

  constructor(random: SeededRandom, config?: RingConfig) {
    this.random = random
    this.config = {
      strokeWidth: config?.strokeWidth ?? [2, 4],
      deformation: config?.deformation ?? 0.15,
    }
  }

  generateRings(size: number): Ring[] {
    const rings: Ring[] = []
    const centerX = size / 2
    const centerY = size / 2
    const baseRadius = size * 0.15 // Base radius for rings

    // Positions for five rings in a tight cluster
    const positions = [
      { x: centerX - baseRadius * 0.3, y: centerY - baseRadius * 0.2 }, // Top left
      { x: centerX, y: centerY - baseRadius * 0.15 }, // Top center
      { x: centerX + baseRadius * 0.3, y: centerY - baseRadius * 0.2 }, // Top right
      { x: centerX - baseRadius * 0.15, y: centerY + baseRadius * 0.15 }, // Bottom left
      { x: centerX + baseRadius * 0.15, y: centerY + baseRadius * 0.15 }, // Bottom right
    ]

    positions.forEach((pos, index) => {
      const strokeWidth = this.getStrokeWidth()
      const path = this.generateImperfectCircle(
        pos.x,
        pos.y,
        baseRadius,
        this.config.deformation!,
      )

      rings.push({
        path,
        strokeWidth,
      })
    })

    return rings
  }

  private getStrokeWidth(): number {
    const sw = this.config.strokeWidth!
    if (Array.isArray(sw)) {
      return sw[0] + this.random.next() * (sw[1] - sw[0])
    }
    return sw
  }

  private generateImperfectCircle(
    cx: number,
    cy: number,
    radius: number,
    deformation: number,
  ): string {
    // Generate control points for a cubic bezier approximation of a circle
    // with random deformations to make it look hand-drawn
    const numSegments = 4
    const angleStep = (Math.PI * 2) / numSegments
    const points: Array<{ x: number; y: number }> = []
    const controlPoints: Array<{ cp1x: number; cp1y: number; cp2x: number; cp2y: number }> = []

    // Generate points with slight random variations
    for (let i = 0; i < numSegments; i++) {
      const angle = i * angleStep
      const deformRadius = radius * (1 + (this.random.next() - 0.5) * deformation)
      const angleOffset = (this.random.next() - 0.5) * deformation * 0.3
      const finalAngle = angle + angleOffset

      points.push({
        x: cx + Math.cos(finalAngle) * deformRadius,
        y: cy + Math.sin(finalAngle) * deformRadius,
      })
    }

    // Calculate control points for smooth curves
    const kappa = 0.5522847498 // Magic number for circle approximation

    for (let i = 0; i < numSegments; i++) {
      const p1 = points[i]
      const p2 = points[(i + 1) % numSegments]

      if (!p1 || !p2) continue

      // Direction from center to point
      const angle1 = Math.atan2(p1.y - cy, p1.x - cx)
      const angle2 = Math.atan2(p2.y - cy, p2.x - cx)

      // Control point distances with variation
      const cp1Distance = radius * kappa * (1 + (this.random.next() - 0.5) * deformation * 0.5)
      const cp2Distance = radius * kappa * (1 + (this.random.next() - 0.5) * deformation * 0.5)

      // Control points perpendicular to radius
      controlPoints.push({
        cp1x: p1.x + Math.cos(angle1 + Math.PI / 2) * cp1Distance,
        cp1y: p1.y + Math.sin(angle1 + Math.PI / 2) * cp1Distance,
        cp2x: p2.x + Math.cos(angle2 - Math.PI / 2) * cp2Distance,
        cp2y: p2.y + Math.sin(angle2 - Math.PI / 2) * cp2Distance,
      })
    }

    // Build SVG path
    const firstPoint = points[0]
    if (!firstPoint) return 'M 0 0'

    let path = `M ${firstPoint.x} ${firstPoint.y}`

    for (let i = 0; i < numSegments; i++) {
      const cp = controlPoints[i]
      const nextPoint = points[(i + 1) % numSegments]
      if (cp && nextPoint) {
        path += ` C ${cp.cp1x} ${cp.cp1y}, ${cp.cp2x} ${cp.cp2y}, ${nextPoint.x} ${nextPoint.y}`
      }
    }

    // Close the path
    path += ' Z'

    return path
  }
}

export function createRingGenerator(random: SeededRandom, config?: RingConfig): RingGenerator {
  return new RingGenerator(random, config)
}
