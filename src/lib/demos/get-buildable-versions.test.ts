import { VersionHistory } from '#lib/version-history/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as configModule from './config.ts'
import { getBuildableVersions, getBuildableVersionsAsMatrix } from './get-buildable-versions.ts'

// Mock the modules
vi.mock('#lib/version-history/index')
vi.mock('./config.ts')

describe('getBuildableVersions', () => {
  const mockConfig: configModule.DemoConfig = {
    examples: {
      exclude: [],
      order: [],
      minimumVersion: '0.1.0',
      disabled: [],
    },
    deployment: {
      basePaths: {
        '/latest/': 'Stable releases',
        '/next/': 'Next/beta releases',
      },
      redirects: [],
      gc: {
        retainStableVersions: true,
        retainCurrentCycle: true,
        retainDays: 30,
      },
    },
    ui: {
      theme: {
        primaryColor: '#000',
        backgroundColor: '#fff',
        textColor: '#000',
        mutedTextColor: '#666',
      },
      content: {
        title: 'Polen Demos',
        description: 'Interactive GraphQL API documentation',
      },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(configModule.loadConfig).mockResolvedValue(mockConfig)
  })

  it('returns empty when no stable version exists', async () => {
    vi.mocked(VersionHistory.getCurrentDevelopmentCycle).mockResolvedValue({
      stable: undefined,
      all: [],
      preReleases: [],
    } as any)

    const result = await getBuildableVersions()

    expect(result).toEqual({
      versions: [],
      stable: undefined,
      hasVersions: false,
    })
  })

  it('filters versions based on minimum Polen version', async () => {
    const mockCycle = {
      stable: { git: { tag: 'v1.2.0' } },
      all: [
        { git: { tag: 'v1.0.0' } },
        { git: { tag: 'v1.1.0' } },
        { git: { tag: 'v1.2.0' } },
      ],
      preReleases: [],
    }

    vi.mocked(VersionHistory.getCurrentDevelopmentCycle).mockResolvedValue(mockCycle as any)
    vi.mocked(configModule.meetsMinimumPolenVersion)
      .mockReturnValueOnce(false) // v1.0.0 doesn't meet minimum
      .mockReturnValueOnce(true) // v1.1.0 meets minimum
      .mockReturnValueOnce(true) // v1.2.0 meets minimum

    const result = await getBuildableVersions()

    expect(result).toEqual({
      versions: ['v1.1.0', 'v1.2.0'],
      stable: 'v1.2.0',
      hasVersions: true,
    })

    expect(configModule.meetsMinimumPolenVersion).toHaveBeenCalledTimes(3)
    expect(configModule.meetsMinimumPolenVersion).toHaveBeenCalledWith(mockConfig, 'v1.0.0')
    expect(configModule.meetsMinimumPolenVersion).toHaveBeenCalledWith(mockConfig, 'v1.1.0')
    expect(configModule.meetsMinimumPolenVersion).toHaveBeenCalledWith(mockConfig, 'v1.2.0')
  })

  it('uses provided config instead of loading', async () => {
    const customConfig: configModule.DemoConfig = {
      examples: {
        exclude: [],
        order: [],
        minimumVersion: '2.0.0',
        disabled: [],
      },
      deployment: {
        basePaths: {
          '/latest/': 'Stable releases',
          '/next/': 'Next/beta releases',
        },
        redirects: [],
        gc: {
          retainStableVersions: true,
          retainCurrentCycle: true,
          retainDays: 30,
        },
      },
      ui: {
        theme: {
          primaryColor: '#000',
          backgroundColor: '#fff',
          textColor: '#000',
          mutedTextColor: '#666',
        },
        content: {
          title: 'Polen Demos',
          description: 'Interactive GraphQL API documentation',
        },
      },
    }

    const mockCycle = {
      stable: { git: { tag: 'v2.0.0' } },
      all: [{ git: { tag: 'v2.0.0' } }],
      preReleases: [],
    }

    vi.mocked(VersionHistory.getCurrentDevelopmentCycle).mockResolvedValue(mockCycle as any)
    vi.mocked(configModule.meetsMinimumPolenVersion).mockReturnValue(true)

    const result = await getBuildableVersions(customConfig)

    expect(result).toEqual({
      versions: ['v2.0.0'],
      stable: 'v2.0.0',
      hasVersions: true,
    })

    expect(configModule.loadConfig).not.toHaveBeenCalled()
    expect(configModule.meetsMinimumPolenVersion).toHaveBeenCalledWith(customConfig, 'v2.0.0')
  })

  it('handles empty buildable versions list', async () => {
    const mockCycle = {
      stable: { git: { tag: 'v1.0.0' } },
      all: [{ git: { tag: 'v1.0.0' } }],
      preReleases: [],
    }

    vi.mocked(VersionHistory.getCurrentDevelopmentCycle).mockResolvedValue(mockCycle as any)
    vi.mocked(configModule.meetsMinimumPolenVersion).mockReturnValue(false)

    const result = await getBuildableVersions()

    expect(result).toEqual({
      versions: [],
      stable: 'v1.0.0',
      hasVersions: false,
    })
  })
})

describe('getBuildableVersionsAsMatrix', () => {
  it('returns JSON string of versions array', async () => {
    vi.mocked(VersionHistory.getCurrentDevelopmentCycle).mockResolvedValue({
      stable: { git: { tag: 'v1.2.0' } },
      all: [
        { git: { tag: 'v1.1.0' } },
        { git: { tag: 'v1.2.0' } },
      ],
      preReleases: [],
    } as any)

    vi.mocked(configModule.meetsMinimumPolenVersion).mockReturnValue(true)

    const result = await getBuildableVersionsAsMatrix()

    expect(result).toBe('["v1.1.0","v1.2.0"]')
    expect(JSON.parse(result)).toEqual(['v1.1.0', 'v1.2.0'])
  })

  it('returns empty array JSON when no versions', async () => {
    vi.mocked(VersionHistory.getCurrentDevelopmentCycle).mockResolvedValue({
      stable: undefined,
      all: [],
      preReleases: [],
    } as any)

    const result = await getBuildableVersionsAsMatrix()

    expect(result).toBe('[]')
    expect(JSON.parse(result)).toEqual([])
  })
})
