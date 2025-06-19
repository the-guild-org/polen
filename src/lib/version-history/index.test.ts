import { parse as semverParse } from '@vltpkg/semver'
import type { SimpleGit } from 'simple-git'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { getCurrentDevelopmentCycle, isPrerelease, isSemverTag, parseSemver } from './index.ts'

describe('VersionHistory', () => {
  describe('parseSemver', () => {
    it('parses standard semver tags', () => {
      const version = parseSemver('1.2.3')
      expect(version).not.toBeNull()
      expect(version?.major).toBe(1)
      expect(version?.minor).toBe(2)
      expect(version?.patch).toBe(3)
      expect(version?.prerelease).toBeUndefined()
    })

    it('parses semver tags with v prefix', () => {
      const version = parseSemver('v1.2.3')
      expect(version).not.toBeNull()
      expect(version?.major).toBe(1)
      expect(version?.minor).toBe(2)
      expect(version?.patch).toBe(3)
    })

    it('parses prerelease versions', () => {
      const version = parseSemver('1.2.3-beta.1')
      expect(version).not.toBeNull()
      expect(version?.major).toBe(1)
      expect(version?.minor).toBe(2)
      expect(version?.patch).toBe(3)
      expect(version?.prerelease).toEqual(['beta', 1])
    })

    it('returns null for invalid semver', () => {
      expect(parseSemver('not-a-version')).toBeNull()
      expect(parseSemver('1.2')).toBeNull()
      expect(parseSemver('latest')).toBeNull()
    })
  })

  describe('isSemverTag', () => {
    it('identifies valid semver tags', () => {
      expect(isSemverTag('1.2.3')).toBe(true)
      expect(isSemverTag('v1.2.3')).toBe(true)
      expect(isSemverTag('1.0.0-beta.1')).toBe(true)
      expect(isSemverTag('0.0.1')).toBe(true)
    })

    it('rejects invalid semver tags', () => {
      expect(isSemverTag('latest')).toBe(false)
      expect(isSemverTag('next')).toBe(false)
      expect(isSemverTag('1.2')).toBe(false)
      expect(isSemverTag('v1.2')).toBe(false)
      expect(isSemverTag('not-a-version')).toBe(false)
    })
  })

  describe('isPrerelease', () => {
    it('identifies prerelease versions', () => {
      expect(isPrerelease('1.0.0-beta.1')).toBe(true)
      expect(isPrerelease('2.0.0-next.5')).toBe(true)
      expect(isPrerelease('3.0.0-alpha')).toBe(true)
    })

    it('identifies stable versions', () => {
      expect(isPrerelease('1.0.0')).toBe(false)
      expect(isPrerelease('v2.3.4')).toBe(false)
    })
  })

  describe('version sorting', () => {
    it('sorts versions correctly', () => {
      const versions = [
        { semver: semverParse('1.0.0')!, isPrerelease: false },
        { semver: semverParse('2.0.0')!, isPrerelease: false },
        { semver: semverParse('1.1.0')!, isPrerelease: false },
        { semver: semverParse('1.0.1')!, isPrerelease: false },
        { semver: semverParse('2.0.0-beta.1')!, isPrerelease: true },
      ]

      const sorted = [...versions].sort((a, b) => {
        // Reverse comparison for descending order
        return b.semver.compare(a.semver)
      })

      expect(sorted[0]!.semver.toString()).toBe('2.0.0')
      expect(sorted[1]!.semver.toString()).toBe('2.0.0-beta.1')
      expect(sorted[2]!.semver.toString()).toBe('1.1.0')
      expect(sorted[3]!.semver.toString()).toBe('1.0.1')
      expect(sorted[4]!.semver.toString()).toBe('1.0.0')
    })
  })

  describe('getCurrentDevelopmentCycle', () => {
    let mockGit: {
      tags: Mock
      show: Mock
      revparse: Mock
      tag: Mock
    }

    beforeEach(() => {
      mockGit = {
        tags: vi.fn(),
        show: vi.fn(),
        revparse: vi.fn(),
        tag: vi.fn(),
      }
      // versionHistory = new VersionHistory()
      // @ts-expect-error - mocking private property
      versionHistory.git = mockGit as unknown as SimpleGit
    })

    it('returns latest stable and newer prereleases', async () => {
      // Mock git tags
      mockGit.tags.mockResolvedValue({
        all: ['1.0.0', '1.1.0', '1.2.0', '2.0.0-beta.1', '2.0.0-beta.2', '2.0.0'],
      })

      // Mock git show for each tag
      const mockDates = {
        '1.0.0': '1234567890',
        '1.1.0': '1234567900',
        '1.2.0': '1234567910',
        '2.0.0-beta.1': '1234567920',
        '2.0.0-beta.2': '1234567930',
        '2.0.0': '1234567940',
      }

      mockGit.show.mockImplementation((args: string[]) => {
        const tag = args[0]?.replace('^{commit}', '') || ''
        const timestamp = mockDates[tag as keyof typeof mockDates]
        return Promise.resolve(`abc123 ${timestamp}`)
      })

      const cycle = await getCurrentDevelopmentCycle()

      expect(cycle.stable?.git.tag).toBe('2.0.0')
      expect(cycle.prereleases).toHaveLength(0) // No prereleases after stable version 2.0.0
      expect(cycle.all).toHaveLength(1) // Just the stable version
    })

    it('includes prereleases newer than latest stable', async () => {
      // Mock git tags
      mockGit.tags.mockResolvedValue({
        all: ['1.0.0', '1.1.0', '2.0.0-beta.1', '2.0.0-beta.2'],
      })

      // Mock git show for each tag
      const mockDates = {
        '1.0.0': '1234567890',
        '1.1.0': '1234567900',
        '2.0.0-beta.1': '1234567910',
        '2.0.0-beta.2': '1234567920',
      }

      mockGit.show.mockImplementation((args: string[]) => {
        const tag = args[0]?.replace('^{commit}', '') || ''
        const timestamp = mockDates[tag as keyof typeof mockDates]
        return Promise.resolve(`abc123 ${timestamp}`)
      })

      const cycle = await getCurrentDevelopmentCycle()

      expect(cycle.stable?.git.tag).toBe('1.1.0') // Latest stable version
      expect(cycle.prereleases).toHaveLength(2) // Prereleases newer than stable
      expect(cycle.prereleases[0]?.git.tag).toBe('2.0.0-beta.2')
      expect(cycle.prereleases[1]?.git.tag).toBe('2.0.0-beta.1')
      expect(cycle.all).toHaveLength(3) // Stable + 2 prereleases
    })

    it('returns all versions as prereleases when no stable version exists', async () => {
      // Mock git tags with only prereleases
      mockGit.tags.mockResolvedValue({
        all: ['0.1.0-alpha.1', '0.1.0-alpha.2', '0.1.0-beta.1'],
      })

      // Mock git show for each tag
      mockGit.show.mockImplementation(() => Promise.resolve('abc123 1234567890'))

      const cycle = await getCurrentDevelopmentCycle()

      expect(cycle.stable).toBeNull()
      expect(cycle.prereleases).toHaveLength(3)
      expect(cycle.all).toHaveLength(3)
    })
  })
})
