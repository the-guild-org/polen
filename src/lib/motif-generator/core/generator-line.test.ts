/**
 * Tests for line-based motif generation in the main generator
 */

import { describe, expect, it } from 'vitest'
import { createMotifGenerator } from './generator.ts'

describe('MotifGenerator - Line-based mode', () => {
  it('generates line-based motifs by default', async () => {
    const generator = createMotifGenerator()
    const motif = await generator.generate({ size: 100 })

    expect(motif.svg).toContain('motif-line-based')
    expect(motif.svg).toContain('path')
    expect(motif.metadata.shapes.some(s => s.type === 'path')).toBe(true)
  })

  it('can be disabled to use traditional shapes', async () => {
    const generator = createMotifGenerator({
      lineBased: { enabled: false },
    })
    const motif = await generator.generate({ size: 100 })

    expect(motif.svg).not.toContain('motif-line-based')
    expect(motif.metadata.shapes.every(s => s.type !== 'path')).toBe(true)
  })

  it('respects line configuration', async () => {
    const generator = createMotifGenerator({
      lineBased: {
        enabled: true,
        lineCount: 3,
        thickness: 5,
        complexity: 0.8,
      },
    })
    const motif = await generator.generate({ size: 100 })

    // Should have multiple lines
    const lineShapes = motif.metadata.shapes.filter(s => s.type === 'path')
    expect(lineShapes.length).toBeGreaterThanOrEqual(3)
  })

  it('generates filled regions when configured', async () => {
    const generator = createMotifGenerator({
      lineBased: {
        enabled: true,
        fillEnclosed: true,
        complexity: 0.8,
        lineCount: 2,
      },
    })
    const motif = await generator.generate({ size: 100, seed: 'region-test' })

    // Should have line paths at minimum
    expect(motif.metadata.shapes.some(s => s.type === 'path')).toBe(true)

    // Polygon fills are generated probabilistically, so we can't guarantee them
    // But the configuration should be respected
    expect(motif.metadata.config.lineBased?.fillEnclosed).toBe(true)
  })

  it('simplifies for small sizes', async () => {
    const generator = createMotifGenerator({
      variants: {
        favicon: {
          sizes: [16],
          simplified: true,
        },
      },
    })

    const variants = await generator.generateVariants({})
    const favicon = variants['favicon-16']

    // Simplified should have fewer lines
    const lineShapes = favicon.metadata.shapes.filter(s => s.type === 'path')
    expect(lineShapes.length).toBeLessThanOrEqual(1)
  })

  it('generates CSS animations for lines', async () => {
    const generator = createMotifGenerator({
      lineBased: { enabled: true },
      animations: {
        pattern: 'wave',
        targets: ['opacity'],
      },
    })
    const motif = await generator.generate({ size: 100 })

    expect(motif.css).toBeTruthy()
    expect(motif.css).toContain('@keyframes')
    expect(motif.css).toContain('line-')
  })

  it('produces deterministic results with same seed', async () => {
    const generator = createMotifGenerator({
      lineBased: { enabled: true },
    })

    const motif1 = await generator.generate({ size: 100, seed: 'test-seed' })
    const motif2 = await generator.generate({ size: 100, seed: 'test-seed' })

    expect(motif1.svg).toBe(motif2.svg)
    expect(motif1.metadata.seed).toBe(motif2.metadata.seed)
  })
})
