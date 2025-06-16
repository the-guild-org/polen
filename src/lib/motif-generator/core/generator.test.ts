import { promises as fs } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateMotif, MotifGenerator } from './generator.ts'
import type { MotifConfig } from './types.ts'

describe('MotifGenerator', () => {
  const testHistoryPath = '.test-motif-history'

  beforeAll(async () => {
    // Clean up any existing test history
    try {
      await fs.rm(testHistoryPath, { recursive: true })
    } catch {}
  })

  afterAll(async () => {
    // Clean up test history
    try {
      await fs.rm(testHistoryPath, { recursive: true })
    } catch {}
  })

  describe('generation', () => {
    it('should generate deterministic motifs from same seed', async () => {
      const generator = new MotifGenerator()

      const motif1 = await generator.generate({ size: 100, seed: 'test-seed' })
      const motif2 = await generator.generate({ size: 100, seed: 'test-seed' })

      expect(motif1.svg).toBe(motif2.svg)
      expect(motif1.metadata.seed).toBe(motif2.metadata.seed)
    })

    it('should generate different motifs from different seeds', async () => {
      const generator = new MotifGenerator()

      const motif1 = await generator.generate({ size: 100, seed: 'seed1' })
      const motif2 = await generator.generate({ size: 100, seed: 'seed2' })

      expect(motif1.svg).not.toBe(motif2.svg)
    })

    it('should respect size parameter', async () => {
      const generator = new MotifGenerator()

      const motif = await generator.generate({ size: 200 })

      expect(motif.svg).toContain('width="200"')
      expect(motif.svg).toContain('height="200"')
      expect(motif.svg).toContain('viewBox="0 0 200 200"')
    })

    it('should apply dark mode adjustments', async () => {
      const generator = new MotifGenerator({
        colors: { mode: 'any', lightness: [30, 50] },
      })

      const lightMotif = await generator.generate({ size: 100, seed: 'dm-test' })
      const darkMotif = await generator.generate({ size: 100, seed: 'dm-test', darkMode: true })

      // SVG structure should be similar but colors different
      expect(lightMotif.svg.length).toBeCloseTo(darkMotif.svg.length, -2)
      expect(lightMotif.svg).not.toBe(darkMotif.svg)
    })
  })

  describe('configuration', () => {
    it('should apply monochrome mode', async () => {
      const config: Partial<MotifConfig> = {
        colors: { mode: 'monochrome' },
      }

      const generator = new MotifGenerator(config)
      const motif = await generator.generate({ size: 100 })

      // Extract colors from SVG
      const colorMatches = motif.svg.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%/g) || []

      colorMatches.forEach(color => {
        const match = color.match(/hsl\((\d+)\s+(\d+)%/)
        if (match) {
          expect(parseInt(match[2] || '0')).toBe(0) // Saturation should be 0
        }
      })
    })

    it('should apply shape configuration', async () => {
      const config: Partial<MotifConfig> = {
        lineBased: { enabled: false }, // Disable line-based to test shape configuration
        shapes: { curves: 1, points: 5 },
        composition: { layers: 1, density: 0.3 },
      }

      const generator = new MotifGenerator(config)
      const motif = await generator.generate({ size: 100, seed: 'shape-test' })

      // Should have curved shapes in the output
      // The test seed might not always generate visible circles
      expect(motif.metadata.shapes.some(s => ['circle', 'ellipse', 'bezier'].includes(s.type))).toBe(true)
    })

    it('should apply composition style', async () => {
      const config: Partial<MotifConfig> = {
        composition: { style: 'grid', layers: 1, density: 0.5 },
      }

      const generator = new MotifGenerator(config)
      const motif = await generator.generate({ size: 100, seed: 'grid-test' })

      // Grid style should create regular positioning
      expect(motif.metadata.shapes.length).toBeGreaterThan(0)
    })
  })

  describe('animations', () => {
    it('should generate CSS animations when configured', async () => {
      const config: Partial<MotifConfig> = {
        animations: {
          pattern: 'wave',
          targets: ['opacity', 'position'],
        },
      }

      const generator = new MotifGenerator(config)
      const motif = await generator.generate({ size: 100 })

      expect(motif.css).toBeTruthy()
      expect(motif.css).toContain('@keyframes')
      expect(motif.css).toContain('animation:')
    })

    it('should respect reduced motion', async () => {
      const config: Partial<MotifConfig> = {
        animations: {
          pattern: 'wave',
          targets: ['opacity'],
          respectReducedMotion: true,
        },
      }

      const generator = new MotifGenerator(config)
      const motif = await generator.generate({ size: 100 })

      expect(motif.css).toContain('@media (prefers-reduced-motion: reduce)')
    })
  })

  describe('effects', () => {
    it('should apply visual effects', async () => {
      const config: Partial<MotifConfig> = {
        effects: {
          grain: 0.5,
          blur: 0.3,
          glow: true,
          shadows: true,
        },
      }

      const generator = new MotifGenerator(config)
      const motif = await generator.generate({ size: 100 })

      expect(motif.svg).toContain('<defs>')
      expect(motif.svg).toContain('<filter')
      expect(motif.svg).toContain('filter="url(#')
    })
  })

  describe('variants', () => {
    it('should generate multiple size variants', async () => {
      const config: Partial<MotifConfig> = {
        variants: {
          favicon: { sizes: [16, 32], simplified: true },
          logo: { sizes: { sm: 40, lg: 100 }, responsive: false },
        },
      }

      const generator = new MotifGenerator(config)
      const variants = await generator.generateVariants({ seed: 'variant-test' })

      expect(variants['favicon-16']).toBeDefined()
      expect(variants['favicon-32']).toBeDefined()
      expect(variants['logo-sm']).toBeDefined()
      expect(variants['logo-lg']).toBeDefined()

      const favicon16 = variants['favicon-16']
      const logoLg = variants['logo-lg']
      expect(favicon16?.svg).toContain('width="16"')
      expect(logoLg?.svg).toContain('width="100"')
    })

    it('should simplify small favicons', async () => {
      const config: Partial<MotifConfig> = {
        variants: {
          favicon: { sizes: [16], simplified: true },
        },
        composition: { layers: 3, density: 0.8 },
      }

      const generator = new MotifGenerator(config)
      const variants = await generator.generateVariants({ seed: 'simplify-test' })

      const favicon = variants['favicon-16']
      // Simplified should have fewer shapes
      expect(favicon?.metadata.shapes.length).toBeLessThan(10)
    })
  })

  describe('persistence', () => {
    it('should save to history when configured', async () => {
      const config: Partial<MotifConfig> = {
        regeneration: {
          onChange: 'refresh',
          persist: true,
          historyPath: testHistoryPath,
          historyLimit: 5,
        },
      }

      const generator = new MotifGenerator(config)

      // Generate a few motifs
      for (let i = 0; i < 3; i++) {
        await generator.generate({ size: 100 })
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Check history directory exists
      const stats = await fs.stat(testHistoryPath)
      expect(stats.isDirectory()).toBe(true)
    })
  })

  describe('convenience function', () => {
    it('should generate motif with single function call', async () => {
      const motif = await generateMotif({
        size: 100,
        seed: 'convenience-test',
        config: {
          colors: { mode: 'duotone' },
        },
      })

      expect(motif.svg).toBeTruthy()
      expect(motif.metadata.seed).toBe('convenience-test')
    })
  })
})
