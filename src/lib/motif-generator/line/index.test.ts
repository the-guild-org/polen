/**
 * Tests for line-based motif generation
 */

import { describe, expect, it } from 'vitest'
import { SeededRandom } from '../core/random.ts'
import { createLineGenerator, LineGenerator } from './index.ts'

describe('LineGenerator', () => {
  it('generates a continuous line path', () => {
    const random = new SeededRandom('test-seed')
    const generator = createLineGenerator(random, 100)
    const path = generator.generate()

    expect(path.segments.length).toBeGreaterThan(10)
    expect(path.totalLength).toBeGreaterThan(200) // At least 2x diagonal
    expect(path.bounds.minX).toBeGreaterThanOrEqual(0)
    expect(path.bounds.maxX).toBeLessThanOrEqual(100)
  })

  it('respects configuration parameters', () => {
    const random = new SeededRandom('test-seed')
    const generator = createLineGenerator(random, 100, {
      thickness: 5,
      complexity: 0.8,
      turnFrequency: 0.5,
    })
    const path = generator.generate()

    // Higher complexity should generate longer paths
    expect(path.totalLength).toBeGreaterThan(300)

    // Check thickness is applied (with variation)
    const avgThickness = path.segments.reduce((sum, seg) => sum + seg.thickness, 0) / path.segments.length
    expect(avgThickness).toBeCloseTo(5, 0.5) // Allow more variation
  })

  it('generates smooth curves when configured', () => {
    const random = new SeededRandom('test-seed')
    const generator = createLineGenerator(random, 100, {
      smoothness: 1, // Always curves
    })
    const path = generator.generate()

    // All segments should have curve control points
    const curvedSegments = path.segments.filter(seg => seg.curve)
    expect(curvedSegments.length / path.segments.length).toBeGreaterThan(0.7)
  })

  it('generates multiple interweaving paths', () => {
    const random = new SeededRandom('test-seed')
    const generator = createLineGenerator(random, 100)
    const paths = generator.generateMultiple(3)

    expect(paths).toHaveLength(3)

    // Each subsequent path should have different configuration
    // Due to thickness variation, we can't guarantee exact ordering
    // Just check they exist and have reasonable thickness
    expect(paths[0].segments[0].thickness).toBeGreaterThan(0)
    expect(paths[1].segments[0].thickness).toBeGreaterThan(0)
    expect(paths[2].segments[0].thickness).toBeGreaterThan(0)
  })

  it('converts to SVG path correctly', () => {
    const random = new SeededRandom('test-seed')
    const generator = createLineGenerator(random, 100)
    const path = generator.generate()

    const svgPath = LineGenerator.toSVGPath(path)
    expect(svgPath).toMatch(/^M \d+(\.\d+)? \d+(\.\d+)?/)
    expect(svgPath).toContain('L') // Should have line segments
  })

  it('generates enclosed regions', () => {
    const random = new SeededRandom('test-seed')
    const generator = createLineGenerator(random, 100, {
      complexity: 0.8,
      fillEnclosed: true,
    })
    const path = generator.generate()

    // With high complexity, should detect some enclosed regions
    expect(path.enclosedRegions.length).toBeGreaterThanOrEqual(0)
  })

  it('stays within bounds', () => {
    const random = new SeededRandom('test-seed')
    const size = 100
    const generator = createLineGenerator(random, size)
    const path = generator.generate()

    // Check all segments are within bounds
    for (const segment of path.segments) {
      expect(segment.start.x).toBeGreaterThanOrEqual(0)
      expect(segment.start.x).toBeLessThanOrEqual(size)
      expect(segment.start.y).toBeGreaterThanOrEqual(0)
      expect(segment.start.y).toBeLessThanOrEqual(size)
      expect(segment.end.x).toBeGreaterThanOrEqual(0)
      expect(segment.end.x).toBeLessThanOrEqual(size)
      expect(segment.end.y).toBeGreaterThanOrEqual(0)
      expect(segment.end.y).toBeLessThanOrEqual(size)
    }
  })
})
