import type { Config } from '#api/config/$'
import { Catalog } from '#lib/catalog/$'
import { Grafaid } from '#lib/grafaid'
import { MemoryFilesystem } from '#lib/memory-filesystem/$'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { Effect, HashMap } from 'effect'
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

const createTestConfig = (overrides?: Partial<Config.Config>): Config.Config => ({
  paths: {
    project: {
      rootDir: '/project',
      absolute: {
        root: '/project',
        pages: '/project/pages',
        build: {
          root: '/project/build',
          assets: {
            root: 'assets',
            schemas: 'schemas',
          },
          serverEntrypoint: 'index.js',
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
              relative: {
                schemas: 'schemas',
              },
            },
            serverEntrypoint: 'index.js',
          },
        },
        public: {
          root: 'public',
          logo: 'logo.png',
        },
      },
    },
    framework: {
      rootDir: '/framework',
      sourceDir: '/framework/src',
      name: 'test-package',
      isRunningFromSource: true,
      static: '/framework/static',
      sourceExtension: '.ts',
      template: '/framework/template',
      devAssets: {
        relative: 'dev-assets',
        absolute: '/framework/dev-assets',
        schemas: '/framework/dev-assets/schemas',
      },
    },
  },
  templateVariables: { title: 'Test' },
  build: {
    base: '/',
    architecture: 'ssg',
  },
  server: {
    port: 3000,
    routes: {
      assets: '/assets',
    },
  },
  warnings: {
    interactiveWithoutSchema: {
      enabled: true,
    },
  },
  ssr: {
    enabled: false,
  },
  schema: null,
  _input: {},
  ...overrides,
} as Config.Config)

// Helper to build GraphQL schema using Grafaid to avoid realm issues
const buildSchemaWithGrafaid = (sdl: string) =>
  Effect.gen(function*() {
    const ast = yield* Grafaid.Parse.parseSchema(sdl, { source: 'test' })
    return yield* Grafaid.Schema.fromAST(ast)
  })

// ============================================================================
// Test Setup
// ============================================================================

// Create test suite with FileSystem layer
const testWithFileSystem = Test.suiteWithLayers(NodeFileSystem.layer)

// // Create test suite with memory filesystem layer
// const testWithMemoryFileSystem = <T>(diskLayout: MemoryFilesystem.DiskLayout) =>
//   Test.suiteWithLayers(MemoryFilesystem.layer(diskLayout))

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
  { name: 'undefined revisions',
    config: {},
    expected: { isApplicable: false, result: 'null' } },

  { name: 'null revisions',
    config: { revisions: null },
    expected: { isApplicable: false, result: 'null' } },

  { name: 'empty array',
    config: { revisions: [] },
    expected: { isApplicable: true, result: 'null' } },

  { name: 'single SDL string',
    config: { revisions: sdl1 },
    expected: { isApplicable: true, result: 'unversioned', revisionCount: 1 } },

  { name: 'GraphQLSchema objects',
    config: { revisions: 'USE_EFFECT_SCHEMAS' }, // Will be replaced in test
    expected: { isApplicable: true, result: 'unversioned', revisionCount: 1 } },

  { name: 'pre-built unversioned catalog',
    config: { revisions: 'USE_EFFECT_CATALOG' }, // Will be replaced in test
    expected: { isApplicable: true, result: 'unversioned' } },
], ({ config, expected }) => Effect.gen(function* () {
  const source = Schema.InputSources.Memory.loader
  const context = { paths: createTestConfig().paths }

  // Handle special effect-based cases
  let testConfig = config
  if (config.revisions === 'USE_EFFECT_SCHEMAS') {
    const schema1 = yield* buildSchemaWithGrafaid(sdl1)
    testConfig = { revisions: [schema1] } // Use single schema to avoid changeset calculation
  } else if (config.revisions === 'USE_EFFECT_CATALOG') {
    const schema = yield* buildSchemaWithGrafaid(sdl1)
    testConfig = {
      revisions: Catalog.Unversioned.make({
        schema: {
          _tag: 'SchemaUnversioned',
          revisions: [],
          definition: schema,
        },
      })
    }
  }

  const isApplicable = yield* source.isApplicable(testConfig, context)
  expect(isApplicable).toBe(expected.isApplicable)

  if (expected.isApplicable) {
    const result = yield* source.readIfApplicableOrThrow(testConfig, context)

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
  config: Partial<Config.Config>
  expected: {
    loadOrNull: 'null' | 'catalog'
    loadOrThrow: 'null' | 'catalog' | 'throws'
    errorMessage?: string
  }
}>('Schema.loadOrNull', [
  { name: 'no schema configured',
    config: {},
    expected: { isApplicable: false, loadOrNull: 'null', loadOrThrow: 'throws', errorMessage: 'No applicable schema source found' } },

  { name: 'schema disabled',
    config: { schema: { enabled: false } },
    expected: { isApplicable: false, loadOrNull: 'null', loadOrThrow: 'null' } },

  { name: 'memory source with SDL',
    config: {
      schema: {
        sources: {
          memory: { revisions: sdl1 } // Single SDL to avoid changeset calculation
        }
      }
    },
    expected: { isApplicable: true, loadOrNull: 'catalog', loadOrThrow: 'catalog' } },
], ({ config, expected }) => Effect.gen(function* () {
  const fullConfig = createTestConfig(config)

  // Test loadOrNull
  const nullResult = yield* Schema.loadOrNull(fullConfig)

  if (expected.loadOrNull === 'null') {
    expect(nullResult).toBe(null)
  } else {
    expect(nullResult).not.toBe(null)
    expect(nullResult!.data).not.toBe(null)
    expect(Catalog.is(nullResult!.data!)).toBe(true)
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
      expect(result!.data).not.toBe(null)
      expect(Catalog.is(result!.data!)).toBe(true)
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
          expect(HashMap.size(versioned.entries)).toBe(expected.versionCount)
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
  config: Partial<Config.Config>
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
    expected: { isApplicable: true, detectedSource: 'file', catalogType: 'unversioned' },
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
    expected: { isApplicable: true, detectedSource: 'directory', catalogType: 'unversioned' },
    todo: 'Implement with Effect FileSystem' },

  { name: 'fallback when first not applicable',
    diskLayout: {
      '/project/schema/1.0.0/schema.graphql': sdl1,
    },
    config: {
      paths: { project: { rootDir: '/project' } as any },
      schema: { useSources: ['file', 'versionedDirectory'] }
    },
    expected: { isApplicable: true, detectedSource: 'versionedDirectory', catalogType: 'versioned' },
    todo: 'Implement with Effect FileSystem' },
], ({ diskLayout, config, expected }) => Effect.gen(function* () {
  const fullConfig = createTestConfig(config)

  // Test with memory file system to simulate source priority
  const program = Effect.gen(function* () {
    const result = yield* Schema.loadOrNull(fullConfig)
    expect(result).not.toBe(null)

    // Note: This is a simplified test since we don't have access to which source was detected
    // In a full implementation, we would need the Schema.load function to return source info
    expect(result!.data).not.toBe(null)
    expect(Catalog.is(result!.data!)).toBe(true)

    if (expected.catalogType === 'versioned') {
      expect(result!.data!._tag).toBe('CatalogVersioned')
    } else {
      expect(result!.data!._tag).toBe('CatalogUnversioned')
    }
  })

  yield* program.pipe(Effect.provide(MemoryFilesystem.layer(diskLayout)))
}))
