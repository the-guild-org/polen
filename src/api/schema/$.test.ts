import type { Config } from '#api/config/config'
import { Catalog } from '#lib/catalog/$'
import { MemoryFilesystem } from '#lib/memory-filesystem/$'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Effect } from 'effect'
import { buildSchema } from 'graphql'
import { expect } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'
import { Schema } from './$.js'

// ============================================================================
// Test Fixtures
// ============================================================================

const sdl1 = `
  type Query {
    hello: String
  }
`

const sdl2 = `
  type Query {
    hello: String
    world: String
  }
`

const sdl3 = `
  type Query {
    hello: String
    world: String
    universe: String
  }
`

const createTestConfig = (overrides?: Partial<Config>): Config => ({
  paths: {
    project: {
      rootDir: '/project',
      absolute: {
        root: '/project',
        pages: '/project/pages',
        build: {
          root: '/project/build',
          relative: {
            assets: {
              root: 'assets',
            },
          },
        },
      },
      relative: {
        root: '.',
        pages: 'pages',
        build: {
          root: 'build',
          relative: {
            assets: {
              root: 'assets',
            },
          },
        },
      },
    },
    framework: {
      rootDir: '/framework',
      sourceDir: '/framework/src',
    },
  },
  templateVariables: { title: 'Test' },
  build: {
    base: '/',
    architecture: 'ssg',
  },
  server: {
    port: 3000,
  },
  warnings: {
    renderFailure: true,
  },
  advanced: {
    isSelfContainedMode: false,
    debug: false,
    explorer: false,
  },
  _input: {},
  ...overrides,
})

// ============================================================================
// Test Setup
// ============================================================================

// Create test suite with FileSystem layer
const testWithFileSystem = Test.suiteWithLayers(NodeFileSystem.layer)

// Create test suite with memory filesystem layer
const testWithMemoryFileSystem = <T>(diskLayout: MemoryFilesystem.DiskLayout) =>
  Test.suiteWithLayers(MemoryFilesystem.layer(diskLayout))

// ============================================================================
// Base Test Case Interfaces
// ============================================================================

interface BaseTestCase {
  config: any
  expected: {
    isApplicable: boolean
  }
}

// ============================================================================
// Memory Input Source Tests
// ============================================================================

// dprint-ignore
testWithFileSystem<BaseTestCase&{
  expected: {
    result: 'null' | 'unversioned' | 'versioned'
    revisionCount?: number
    latestRevisionDate?: string
  }
}>('Memory Input Source', [
  { name: 'undefined versions',
    config: {},
    expected: { isApplicable: false, result: 'null' } },

  { name: 'null versions',
    config: { versions: null },
    expected: { isApplicable: false, result: 'null' } },

  { name: 'empty array',
    config: { versions: [] },
    expected: { isApplicable: true, result: 'null' } },

  { name: 'single SDL string',
    config: { versions: sdl1 },
    expected: { isApplicable: true, result: 'unversioned', revisionCount: 1 } },

  { name: 'SDL array',
    config: { versions: [sdl1, sdl2] },
    expected: { isApplicable: true, result: 'unversioned', revisionCount: 2 } },

  { name: 'date-versioned SDL',
    config: {
      versions: [
        { date: new Date('2024-01-01'), value: sdl1 },
        { date: new Date('2024-02-01'), value: sdl2 },
      ]
    },
    expected: { isApplicable: true, result: 'unversioned', revisionCount: 2, latestRevisionDate: '2024-02-01' } },

  { name: 'GraphQLSchema objects',
    config: { versions: [buildSchema(sdl1), buildSchema(sdl2)] },
    expected: { isApplicable: true, result: 'unversioned', revisionCount: 2 } },

  { name: 'pre-built unversioned catalog',
    config: {
      versions: Catalog.Unversioned.make({
        schema: {
          _tag: 'SchemaUnversioned',
          revisions: [],
          definition: buildSchema(sdl1),
        },
      })
    },
    expected: { isApplicable: true, result: 'unversioned' } },
], ({ config, expected }) => Effect.gen(function* () {
  const source = Schema.InputSources.Memory.loader
  const context = { paths: createTestConfig().paths }

  const isApplicable = yield* source.isApplicable(config, context)
  expect(isApplicable).toBe(expected.isApplicable)

  if (expected.isApplicable) {
    const result = yield* source.readIfApplicableOrThrow(config, context)

    if (expected.result === 'null') {
      expect(result).toBe(null)
    } else {
      expect(result).not.toBe(null)
      expect(Catalog.is(result!)).toBe(true)

      if (expected.result === 'unversioned') {
        expect(result!._tag).toBe('CatalogUnversioned')

        if (expected.revisionCount !== undefined) {
          const unversioned = result as Catalog.Unversioned.Unversioned
          expect(unversioned.schema.revisions.length).toBe(expected.revisionCount)
        }

        if (expected.latestRevisionDate !== undefined) {
          const unversioned = result as Catalog.Unversioned.Unversioned
          expect(unversioned.schema.revisions[0]?.date).toBe(expected.latestRevisionDate)
        }
      }
    }
  }
}))

// ============================================================================
// Load Function Tests
// ============================================================================

// dprint-ignore
testWithFileSystem<BaseTestCase & {
  config: Partial<Config>
  expected: {
    loadOrNull: 'null' | 'catalog'
    loadOrThrow: 'null' | 'catalog' | 'throws'
    errorMessage?: string
  }
}>('Schema.loadOrNull', [
  { name: 'no schema configured',
    config: {},
    expected: { loadOrNull: 'null', loadOrThrow: 'throws', errorMessage: 'No applicable schema source found' } },

  { name: 'schema disabled',
    config: { schema: { enabled: false } },
    expected: { loadOrNull: 'null', loadOrThrow: 'null' } },

  { name: 'memory source with SDL',
    config: {
      schema: {
        sources: {
          memory: { versions: [sdl1] }
        }
      }
    },
    expected: { loadOrNull: 'catalog', loadOrThrow: 'catalog' } },
], ({ config, expected }) => Effect.gen(function* () {
  const fullConfig = createTestConfig(config)

  // Test loadOrNull
  const nullResult = yield* Schema.loadOrNull(fullConfig)

  if (expected.loadOrNull === 'null') {
    expect(nullResult).toBe(null)
  } else {
    expect(nullResult).not.toBe(null)
    expect(Catalog.is(nullResult!)).toBe(true)
  }

  // Test loadOrThrow
  if (expected.loadOrThrow === 'throws') {
    const result = yield* Effect.either(Schema.loadOrThrow(fullConfig))
    expect(result._tag).toBe('Left')
    if (result._tag === 'Left') {
      expect(result.left.message).toContain(expected.errorMessage)
    }
  } else {
    const result = yield* Schema.loadOrThrow(fullConfig)
    if (expected.loadOrThrow === 'null') {
      expect(result).toBe(null)
    } else {
      expect(result).not.toBe(null)
      expect(Catalog.is(result!)).toBe(true)
    }
  }
}))

// ============================================================================
// File System Input Sources (Future Effect Implementation)
// ============================================================================

// These tests demonstrate what we'll test when Effect is implemented
// dprint-ignore
testWithFileSystem<BaseTestCase & {
  diskLayout: Record<string, string>
  sourceType: 'file' | 'directory' | 'versionedDirectory'
  expected: {
    catalogType?: 'unversioned' | 'versioned'
    versionCount?: number
    revisionCount?: number
  }
}>('File System Input Sources (Future)', [
  // File source cases
  { name: 'file source - missing file',
    diskLayout: {},
    sourceType: 'file',
    config: { path: '/project/schema.graphql' },
    expected: { isApplicable: false },
    todo: 'Implement with Effect FileSystem' },

  { name: 'file source - existing file',
    diskLayout: { '/project/schema.graphql': sdl1 },
    sourceType: 'file',
    config: { path: '/project/schema.graphql' },
    expected: { isApplicable: true, catalogType: 'unversioned', revisionCount: 1 },
    todo: 'Implement with Effect FileSystem' },

  { name: 'file source - non-graphql file',
    diskLayout: { '/project/schema.txt': sdl1 },
    sourceType: 'file',
    config: { path: '/project/schema.txt' },
    expected: { isApplicable: false },
    todo: 'Implement with Effect FileSystem' },

  // Directory source cases
  { name: 'directory source - missing directory',
    diskLayout: {},
    sourceType: 'directory',
    config: { path: '/project/schema' },
    expected: { isApplicable: false },
    todo: 'Implement with Effect FileSystem' },

  { name: 'directory source - empty directory',
    diskLayout: { '/project/schema/.gitkeep': '' },
    sourceType: 'directory',
    config: { path: '/project/schema' },
    expected: { isApplicable: false },
    todo: 'Implement with Effect FileSystem' },

  { name: 'directory source - invalid file names',
    diskLayout: {
      '/project/schema/readme.md': '# Schema',
      '/project/schema/invalid.graphql': sdl1,
    },
    sourceType: 'directory',
    config: { path: '/project/schema' },
    expected: { isApplicable: false },
    todo: 'Implement with Effect FileSystem' },

  { name: 'directory source - valid date files',
    diskLayout: {
      '/project/schema/2024-01-01.graphql': sdl1,
      '/project/schema/2024-02-01.graphql': sdl2,
    },
    sourceType: 'directory',
    config: { path: '/project/schema' },
    expected: { isApplicable: true, catalogType: 'unversioned', revisionCount: 2 },
    todo: 'Implement with Effect FileSystem' },

  // Versioned directory cases
  { name: 'versioned directory - missing directory',
    diskLayout: {},
    sourceType: 'versionedDirectory',
    config: { path: '/project/schema' },
    expected: { isApplicable: false },
    todo: 'Implement with Effect FileSystem' },

  { name: 'versioned directory - invalid version names',
    diskLayout: {
      '/project/schema/invalid/schema.graphql': sdl1,
      '/project/schema/readme.md': '# Schema',
    },
    sourceType: 'versionedDirectory',
    config: { path: '/project/schema' },
    expected: { isApplicable: false },
    todo: 'Implement with Effect FileSystem' },

  { name: 'versioned directory - valid versions',
    diskLayout: {
      '/project/schema/1.0.0/schema.graphql': sdl1,
      '/project/schema/2.0.0/schema.graphql': sdl2,
      '/project/schema/3.0.0/schema.graphql': sdl3,
    },
    sourceType: 'versionedDirectory',
    config: { path: '/project/schema' },
    expected: { isApplicable: true, catalogType: 'versioned', versionCount: 3 },
    todo: 'Implement with Effect FileSystem' },

  { name: 'versioned directory - mixed valid/invalid',
    diskLayout: {
      '/project/schema/1.0.0/readme.md': '# Version 1',
      '/project/schema/2.0.0/schema.graphql': sdl2,
    },
    sourceType: 'versionedDirectory',
    config: { path: '/project/schema' },
    expected: { isApplicable: true, catalogType: 'versioned', versionCount: 1 },
    todo: 'Implement with Effect FileSystem' },
], ({ diskLayout, sourceType, config, expected }) => Effect.gen(function* () {
  // Get the appropriate input source loader
  const sourceLoaders = {
    'file': Schema.InputSources.File.loader,
    'directory': Schema.InputSources.Directory.loader, 
    'versionedDirectory': Schema.InputSources.VersionedDirectory.loader,
  }
  const source = sourceLoaders[sourceType]
  const context = { paths: createTestConfig().paths }

  // Test with memory file system
  const program = Effect.gen(function* () {
    const isApplicable = yield* source.isApplicable(config, context)
    expect(isApplicable).toBe(expected.isApplicable)

    if (expected.isApplicable && expected.catalogType) {
      const result = yield* source.readIfApplicableOrThrow(config, context)
      expect(result).not.toBe(null)
      expect(Catalog.is(result!)).toBe(true)

      if (expected.catalogType === 'versioned') {
        expect(result!._tag).toBe('CatalogVersioned')
        if (expected.versionCount !== undefined) {
          const versioned = result as Catalog.Versioned.Versioned
          expect(versioned.entries.length).toBe(expected.versionCount)
        }
      } else {
        expect(result!._tag).toBe('CatalogUnversioned')
        if (expected.revisionCount !== undefined) {
          const unversioned = result as Catalog.Unversioned.Unversioned
          expect(unversioned.schema.revisions.length).toBe(expected.revisionCount)
        }
      }
    }
  })

  yield* program.pipe(Effect.provide(MemoryFilesystem.layer(diskLayout)))
}))

// ============================================================================
// Source Priority Tests
// ============================================================================

// dprint-ignore
testWithFileSystem<BaseTestCase & {
  diskLayout: Record<string, string>
  config: Partial<Config>
  expected: {
    detectedSource: string
    catalogType: 'unversioned' | 'versioned'
  }
}>('Source Priority (Future)', [
  { name: 'default priority - file over directory',
    diskLayout: {
      '/project/schema.graphql': sdl1,
      '/project/schema/2024-01-01.graphql': sdl2,
    },
    config: { paths: { project: { rootDir: '/project' } as any } },
    expected: { detectedSource: 'file', catalogType: 'unversioned' },
    todo: 'Implement with Effect FileSystem' },

  { name: 'custom priority - directory first',
    diskLayout: {
      '/project/schema.graphql': sdl1,
      '/project/schema/2024-01-01.graphql': sdl2,
    },
    config: {
      paths: { project: { rootDir: '/project' } as any },
      schema: { useSources: ['directory', 'file'] }
    },
    expected: { detectedSource: 'directory', catalogType: 'unversioned' },
    todo: 'Implement with Effect FileSystem' },

  { name: 'fallback when first not applicable',
    diskLayout: {
      '/project/schema/1.0.0/schema.graphql': sdl1,
    },
    config: {
      paths: { project: { rootDir: '/project' } as any },
      schema: { useSources: ['file', 'versionedDirectory'] }
    },
    expected: { detectedSource: 'versionedDirectory', catalogType: 'versioned' },
    todo: 'Implement with Effect FileSystem' },
], ({ diskLayout, config, expected }) => Effect.gen(function* () {
  const fullConfig = createTestConfig(config)

  // Test with memory file system to simulate source priority
  const program = Effect.gen(function* () {
    const result = yield* Schema.loadOrNull(fullConfig)
    expect(result).not.toBe(null)
    
    // Note: This is a simplified test since we don't have access to which source was detected
    // In a full implementation, we would need the Schema.load function to return source info
    expect(Catalog.is(result!)).toBe(true)
    
    if (expected.catalogType === 'versioned') {
      expect(result!._tag).toBe('CatalogVersioned')
    } else {
      expect(result!._tag).toBe('CatalogUnversioned')
    }
  })

  yield* program.pipe(Effect.provide(MemoryFilesystem.layer(diskLayout)))
}))
