import { beforeEach, describe, expect, test, vi } from 'vitest'

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}))

// Mock the virtual import
vi.mock('virtual:polen/project/data.jsonsuper', () => ({
  default: {
    paths: {
      project: {
        absolute: {
          build: {
            assets: {
              schemas: '/mock/schemas',
            },
          },
        },
      },
    },
  },
}))

// Mock the routes
vi.mock('../../routes.js', () => ({
  routes: [
    {
      path: 'reference',
      children: [
        {
          path: 'version/:version',
          children: [
            {
              path: ':type',
            },
          ],
        },
        {
          path: ':type',
        },
      ],
    },
  ],
}))

// Mock the API
vi.mock('#api/index', () => ({
  Api: {
    Schema: {
      getMetadata: vi.fn(),
      VERSION_LATEST: 'latest',
      Routing: {
        createReferencePath: vi.fn((parts) => {
          const version = parts.version || 'latest'
          const basePath = version === 'latest' ? '/reference' : `/reference/version/${version}`
          if (parts.type) {
            return parts.field ? `${basePath}/${parts.type}/${parts.field}` : `${basePath}/${parts.type}`
          }
          return basePath
        }),
        createReferenceBasePath: vi.fn((version) => {
          return version === 'latest' ? '/reference' : `/reference/version/${version}`
        }),
      },
    },
  },
}))

describe('getRoutesPaths', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('should handle versioned routes without type parameter', async () => {
    // Mock schema metadata
    const { Api } = await import('#api/index')
    vi.mocked(Api.Schema.getMetadata).mockResolvedValue({
      hasSchema: true,
      versions: ['2024-01-01', '2024-02-01'],
    })

    // Mock file system reads with proper GraphQL AST
    const NodeFs = await import('node:fs/promises')
    vi.mocked(NodeFs.readFile).mockImplementation(async (path) => {
      if (typeof path === 'string' && path.includes('.json')) {
        // Return a minimal GraphQL document AST
        return JSON.stringify({
          kind: 'Document',
          definitions: [],
        })
      }
      throw new Error(`Unexpected file read: ${path}`)
    })

    const { getRoutesPaths } = await import('./get-route-paths.js')

    // This should not throw "Unhandled parameterized path: /reference/version/:version"
    await expect(getRoutesPaths()).resolves.toBeDefined()
  })

  test('should generate paths for all schema versions', async () => {
    const { Api } = await import('#api/index')
    vi.mocked(Api.Schema.getMetadata).mockResolvedValue({
      hasSchema: true,
      versions: ['2024-01-01', '2024-02-01'],
    })

    // Mock schema with types - proper GraphQL AST
    const mockSchema = {
      kind: 'Document',
      definitions: [
        {
          kind: 'ObjectTypeDefinition',
          name: { kind: 'Name', value: 'User' },
        },
        {
          kind: 'ObjectTypeDefinition',
          name: { kind: 'Name', value: 'Post' },
        },
      ],
    }

    const NodeFs = await import('node:fs/promises')
    vi.mocked(NodeFs.readFile).mockImplementation(async (path) => {
      if (typeof path === 'string' && path.includes('.json')) {
        return JSON.stringify(mockSchema)
      }
      throw new Error(`Unexpected file read: ${path}`)
    })

    const { getRoutesPaths } = await import('./get-route-paths.js')
    const paths = await getRoutesPaths()

    // Should include versioned paths
    expect(paths).toContain('/reference/version/2024-01-01/User')
    expect(paths).toContain('/reference/version/2024-01-01/Post')
    expect(paths).toContain('/reference/version/2024-02-01/User')
    expect(paths).toContain('/reference/version/2024-02-01/Post')

    // Should include unversioned paths
    expect(paths).toContain('/reference/User')
    expect(paths).toContain('/reference/Post')
  })
})
