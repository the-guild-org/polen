import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DemoConfig, getDemoConfig, resetDemoConfig } from './config.ts'

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}))

describe('DemoConfig', () => {
  const mockReadFileSync = readFileSync as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset singleton
    resetDemoConfig()
  })

  describe('constructor', () => {
    it('loads config from default path', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        excludeDemos: ['test1', 'test2'],
        minimumPolenVersion: '1.0.0',
        order: ['demo1', 'demo2'],
      }))

      const config = new DemoConfig()

      expect(mockReadFileSync).toHaveBeenCalledWith('.github/demo-config.json', 'utf-8')
      expect(config.excludeDemos).toEqual(['test1', 'test2'])
      expect(config.minimumPolenVersion).toBe('1.0.0')
      expect(config.order).toEqual(['demo1', 'demo2'])
    })

    it('loads config from custom path', () => {
      mockReadFileSync.mockReturnValue('{}')

      const config = new DemoConfig('custom/path.json')

      expect(mockReadFileSync).toHaveBeenCalledWith('custom/path.json', 'utf-8')
    })

    it('uses defaults when config file is missing', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })

      const config = new DemoConfig()

      expect(config.excludeDemos).toEqual([])
      expect(config.minimumPolenVersion).toBe('0.1.0')
      expect(config.order).toEqual([])
    })

    it('supports legacy minimumVersion field', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        minimumVersion: '0.8.0', // old field name
      }))

      const config = new DemoConfig()

      expect(config.minimumPolenVersion).toBe('0.8.0')
    })

    it('prefers minimumPolenVersion over minimumVersion', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        minimumVersion: '0.8.0',
        minimumPolenVersion: '0.9.0',
      }))

      const config = new DemoConfig()

      expect(config.minimumPolenVersion).toBe('0.9.0')
    })
  })

  describe('meetsMinimumPolenVersion', () => {
    it('returns true when version meets minimum', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        minimumPolenVersion: '1.0.0',
      }))

      const config = new DemoConfig()

      expect(config.meetsMinimumPolenVersion('1.0.0')).toBe(true)
      expect(config.meetsMinimumPolenVersion('1.0.1')).toBe(true)
      expect(config.meetsMinimumPolenVersion('2.0.0')).toBe(true)
    })

    it('returns false when version is below minimum', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        minimumPolenVersion: '1.0.0',
      }))

      const config = new DemoConfig()

      expect(config.meetsMinimumPolenVersion('0.9.0')).toBe(false)
      expect(config.meetsMinimumPolenVersion('0.9.9')).toBe(false)
    })

    it('returns false for invalid versions', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        minimumPolenVersion: '1.0.0',
      }))

      const config = new DemoConfig()

      expect(config.meetsMinimumPolenVersion('invalid')).toBe(false)
      expect(config.meetsMinimumPolenVersion('')).toBe(false)
    })
  })

  describe('isDemoExcluded', () => {
    it('returns true for excluded demos', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        excludeDemos: ['demo1', 'demo2'],
      }))

      const config = new DemoConfig()

      expect(config.isDemoExcluded('demo1')).toBe(true)
      expect(config.isDemoExcluded('demo2')).toBe(true)
    })

    it('returns false for non-excluded demos', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        excludeDemos: ['demo1'],
      }))

      const config = new DemoConfig()

      expect(config.isDemoExcluded('demo3')).toBe(false)
    })
  })

  describe('getOrderedDemos', () => {
    it('orders demos according to config', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        excludeDemos: ['excluded1'],
        order: ['demo3', 'demo1'],
      }))

      const config = new DemoConfig()
      const availableDemos = ['demo1', 'demo2', 'demo3', 'demo4', 'excluded1']

      const ordered = config.getOrderedDemos(availableDemos)

      expect(ordered).toEqual(['demo3', 'demo1', 'demo2', 'demo4'])
    })

    it('handles demos in order that are not available', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({
        order: ['demo1', 'nonexistent', 'demo2'],
      }))

      const config = new DemoConfig()
      const availableDemos = ['demo1', 'demo2', 'demo3']

      const ordered = config.getOrderedDemos(availableDemos)

      expect(ordered).toEqual(['demo1', 'demo2', 'demo3'])
    })
  })

  describe('getDemoConfig singleton', () => {
    it('returns same instance on multiple calls', () => {
      mockReadFileSync.mockReturnValue('{}')

      const config1 = getDemoConfig()
      const config2 = getDemoConfig()

      expect(config1).toBe(config2)
      expect(mockReadFileSync).toHaveBeenCalledTimes(1)
    })

    it('creates new instance when path is provided', () => {
      mockReadFileSync.mockReturnValue('{}')

      const config1 = getDemoConfig()
      const config2 = getDemoConfig('custom/path.json')

      expect(config1).not.toBe(config2)
      expect(mockReadFileSync).toHaveBeenCalledTimes(2)
    })
  })
})
