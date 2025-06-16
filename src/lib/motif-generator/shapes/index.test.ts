import { describe, expect, it } from 'vitest'
import { SeededRandom } from '../core/random.ts'
import type { ShapeConfig } from '../core/types.ts'
import { ShapeGenerator, shapeToSVG } from './index.ts'

describe('ShapeGenerator', () => {
  const random = new SeededRandom('shape-test')
  const size = 100

  describe('shape type selection', () => {
    it('should prefer curves when curves = 1', () => {
      const config: ShapeConfig = { curves: 1, points: 5 }
      const generator = new ShapeGenerator(config, random.fork('curves'), size)

      const shapes = Array.from({ length: 20 }, (_, i) => generator.generate({ h: 0, s: 0, l: 50 }, 0))

      const curvedTypes = ['circle', 'ellipse', 'bezier']
      const curvedCount = shapes.filter(s => curvedTypes.includes(s.type)).length

      expect(curvedCount).toBeGreaterThan(shapes.length * 0.7)
    })

    it('should prefer angles when curves = 0', () => {
      const config: ShapeConfig = { curves: 0, points: 5 }
      const generator = new ShapeGenerator(config, random.fork('angles'), size)

      const shapes = Array.from({ length: 20 }, (_, i) => generator.generate({ h: 0, s: 0, l: 50 }, 0))

      const angularTypes = ['rectangle', 'polygon', 'star']
      const angularCount = shapes.filter(s => angularTypes.includes(s.type)).length

      expect(angularCount).toBeGreaterThan(shapes.length * 0.7)
    })
  })

  describe('position generation', () => {
    it('should center shapes more in higher layers', () => {
      const config: ShapeConfig = { curves: 0.5, points: 5 }
      const generator = new ShapeGenerator(config, random.fork('position'), size)

      const layer0Shapes = Array.from({ length: 10 }, () => generator.generate({ h: 0, s: 0, l: 50 }, 0))

      const layer2Shapes = Array.from({ length: 10 }, () => generator.generate({ h: 0, s: 0, l: 50 }, 2))

      const center = size / 2

      const avgDistLayer0 = layer0Shapes.reduce((sum, s) => sum + Math.hypot(s.x - center, s.y - center), 0)
        / layer0Shapes.length

      const avgDistLayer2 = layer2Shapes.reduce((sum, s) => sum + Math.hypot(s.x - center, s.y - center), 0)
        / layer2Shapes.length

      expect(avgDistLayer2).toBeLessThan(avgDistLayer0)
    })
  })

  describe('properties generation', () => {
    it('should generate correct number of points for polygons', () => {
      const config: ShapeConfig = { curves: 0, points: 6 }
      const generator = new ShapeGenerator(config, random.fork('polygon'), size)

      let shape
      do {
        shape = generator.generate({ h: 0, s: 0, l: 50 }, 0)
      } while (shape.type !== 'polygon')

      expect(shape.properties['points']).toBe(6)
    })

    it('should generate points in range when array provided', () => {
      const config: ShapeConfig = { curves: 0, points: [3, 7] }
      const generator = new ShapeGenerator(config, random.fork('range'), size)

      const polygons = Array.from({ length: 20 }, () => {
        let shape
        do {
          shape = generator.generate({ h: 0, s: 0, l: 50 }, 0)
        } while (shape.type !== 'polygon' && shape.type !== 'star')
        return shape
      })

      polygons.forEach(shape => {
        expect(shape.properties['points']).toBeGreaterThanOrEqual(3)
        expect(shape.properties['points']).toBeLessThanOrEqual(7)
      })
    })

    it('should add corner radius based on curves', () => {
      const config: ShapeConfig = { curves: 0.8, points: 4 }
      const generator = new ShapeGenerator(config, random.fork('corners'), size)

      let shape
      do {
        shape = generator.generate({ h: 0, s: 0, l: 50 }, 0)
      } while (shape.type !== 'rectangle')

      expect(shape.properties['cornerRadius']).toBeGreaterThan(0)
    })
  })
})

describe('shapeToSVG', () => {
  it('should convert circle to SVG', () => {
    const shape = {
      type: 'circle' as const,
      x: 50,
      y: 50,
      width: 40,
      height: 40,
      rotation: 0,
      color: { h: 0, s: 0, l: 0 },
      opacity: 1,
      properties: {},
    }

    const svg = shapeToSVG(shape)
    expect(svg).toBe('<circle cx="50" cy="50" r="20" />')
  })

  it('should convert rectangle with corner radius', () => {
    const shape = {
      type: 'rectangle' as const,
      x: 50,
      y: 50,
      width: 40,
      height: 30,
      rotation: 0,
      color: { h: 0, s: 0, l: 0 },
      opacity: 1,
      properties: { 'cornerRadius': 5 },
    }

    const svg = shapeToSVG(shape)
    expect(svg).toContain('rect')
    expect(svg).toContain('rx="5"')
    expect(svg).toContain('width="40"')
    expect(svg).toContain('height="30"')
  })

  it('should convert polygon to path', () => {
    const shape = {
      type: 'polygon' as const,
      x: 50,
      y: 50,
      width: 40,
      height: 40,
      rotation: 0,
      color: { h: 0, s: 0, l: 0 },
      opacity: 1,
      properties: { 'points': 3 },
    }

    const svg = shapeToSVG(shape)
    expect(svg).toContain('<path')
    expect(svg).toContain('M')
    expect(svg).toContain('Z')
  })

  it('should convert star to path', () => {
    const shape = {
      type: 'star' as const,
      x: 50,
      y: 50,
      width: 40,
      height: 40,
      rotation: 0,
      color: { h: 0, s: 0, l: 0 },
      opacity: 1,
      properties: { 'points': 5, 'innerRadius': 0.4 },
    }

    const svg = shapeToSVG(shape)
    expect(svg).toContain('<path')
    expect(svg).toContain('M')
    expect(svg).toContain('Z')
  })
})
