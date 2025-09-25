import type { Config } from '#api/config/$'
import { Ef, Op } from '#dep/effect'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import { FsMemory } from '@wollybeard/kit'
import { Test } from '@wollybeard/kit/test'
import { HashMap } from 'effect'
import { Catalog, Grafaid, Schema as SchemaLib } from 'graphql-kit'
import { expect } from 'vitest'
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
  Ef.gen(function*() {
    const ast = yield* Grafaid.Parse.parseSchema(sdl, { source: 'test' })
    return yield* Grafaid.Schema.fromAST(ast)
  })

// ============================================================================
// Test Setup
// ============================================================================

// Create test suite with FileSystem layer
const testWithFileSystem = Test.Table.suiteWithLayers(NodeFileSystem.layer)

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

type MemorySourceInput = {
  config: any
}
type MemorySourceOutput = {
  expected: {
    isApplicable: boolean
    result: 'null' | 'unversioned' | 'versioned'
    revisionCount?: number
    latestRevisionDate?: string
  }
}

// dprint-ignore
testWithFileSystem<MemorySourceInput, MemorySourceOutput>('Memory Input Source', [
  { n: 'undefined revisions',
    i: { config: {} },
    o: { expected: { isApplicable: false, result: 'null' } } },

  { n: 'null revisions',
    i: { config: { revisions: null } },
    o: { expected: { isApplicable: false, result: 'null' } } },

  { n: 'empty array',
    i: { config: { revisions: [] } },
    o: { expected: { isApplicable: true, result: 'null' } } },

  { n: 'single SDL string',
    i: { config: { revisions: sdl1 } },
    o: { expected: { isApplicable: true, result: 'unversioned', revisionCount: 1 } } },

  { n: 'GraphQLSchema objects',
    i: { config: { revisions: 'USE_EFFECT_SCHEMAS' } }, // Will be replaced in test
    o: { expected: { isApplicable: true, result: 'unversioned', revisionCount: 1 } } },

  { n: 'pre-built unversioned catalog',
    i: { config: { revisions: 'USE_EFFECT_CATALOG' } }, // Will be replaced in test
    o: { expected: { isApplicable: true, result: 'unversioned' } } },
], ({ i, o }) => Ef.gen(function* () {
  const source = Schema.InputSources.Memory.loader
  const context = { paths: createTestConfig().paths }

  // Handle special effect-based cases
  let testConfig = i.config
  if (i.config.revisions === 'USE_EFFECT_SCHEMAS') {
    const schema1 = yield* buildSchemaWithGrafaid(sdl1)
    testConfig = { revisions: [schema1] } // Use single schema to avoid changeset calculation
  } else if (i.config.revisions === 'USE_EFFECT_CATALOG') {
    const schema = yield* buildSchemaWithGrafaid(sdl1)
    testConfig = {
      revisions: Catalog.Unversioned.make({
        schema: SchemaLib.Unversioned.make({
          revisions: [],
          definition: schema,
        }),
      })
    }
  }

  const isApplicable = yield* source.isApplicable(testConfig, context)
  expect(isApplicable).toBe(o.expected.isApplicable)

  if (o.expected.isApplicable) {
    const result = yield* source.readIfApplicableOrThrow(testConfig, context)

    if (o.expected.result === 'null') {
      expect(result).toBe(null)
    } else {
      expect(result).not.toBe(null)
      expect(Catalog.is(result!)).toBe(true)

      if (o.expected.result === 'unversioned') {
        expect(result!._tag).toBe('CatalogUnversioned')

        if (o.expected.revisionCount !== undefined) {
          const unversioned = result as Catalog.Unversioned
          expect(unversioned.schema.revisions.length).toBe(o.expected.revisionCount)
        }

        if (o.expected.latestRevisionDate !== undefined) {
          const unversioned = result as Catalog.Unversioned
          expect(unversioned.schema.revisions[0]?.date).toBe(o.expected.latestRevisionDate)
        }
      }
    }
  }
}))

// ============================================================================
// Load Function Tests
// ============================================================================

type LoadFunctionInput = {
  config: Partial<Config.Config>
}
type LoadFunctionOutput = {
  expected: {
    isApplicable: boolean
    loadOrNull: 'null' | 'catalog'
    loadOrThrow: 'null' | 'catalog' | 'throws'
    errorMessage?: string
  }
}

// dprint-ignore
testWithFileSystem<LoadFunctionInput, LoadFunctionOutput>('Schema.loadOrNull', [
  { n: 'no schema configured',
    i: { config: {} },
    o: { expected: { isApplicable: false, loadOrNull: 'null', loadOrThrow: 'throws', errorMessage: 'No applicable schema source found' } } },

  { n: 'schema disabled',
    i: { config: { schema: { enabled: false } } },
    o: { expected: { isApplicable: false, loadOrNull: 'null', loadOrThrow: 'null' } } },

  { n: 'memory source with SDL',
    i: { config: {
      schema: {
        sources: {
          memory: { revisions: sdl1 } // Single SDL to avoid changeset calculation
        }
      }
    } },
    o: { expected: { isApplicable: true, loadOrNull: 'catalog', loadOrThrow: 'catalog' } } },
], ({ i, o }) => Ef.gen(function* () {
  const fullConfig = createTestConfig(i.config)

  // Test loadOrNull
  const nullResult = yield* Schema.loadOrNull(fullConfig)

  if (o.expected.loadOrNull === 'null') {
    expect(Op.isNone(nullResult)).toBe(true)
  } else {
    expect(Op.isSome(nullResult)).toBe(true)
    if (Op.isSome(nullResult)) {
      expect(nullResult.value.data).not.toBe(null)
      // The data is wrapped in an Option, so we need to unwrap it
      if (Op.isSome(nullResult.value.data)) {
        expect(Catalog.is(nullResult.value.data.value)).toBe(true)
      } else {
        expect(Op.isSome(nullResult.value.data)).toBe(true) // This will fail if data is None
      }
    }
  }

  // Test loadOrThrow
  if (o.expected.loadOrThrow === 'throws') {
    const result = yield* Ef.either(Schema.loadOrThrow(fullConfig))
    expect(result._tag).toBe('Left')
    if (result._tag === 'Left') {
      expect(result.left.message).toContain(o.expected.errorMessage)
    }
  } else {
    const result = yield* Schema.loadOrThrow(fullConfig)
    if (o.expected.loadOrThrow === 'null') {
      expect(Op.isNone(result)).toBe(true)
    } else {
      expect(Op.isSome(result)).toBe(true)
      if (Op.isSome(result)) {
        expect(result.value.data).not.toBe(null)
        // The data is wrapped in an Option, so we need to unwrap it
        if (Op.isSome(result.value.data)) {
          expect(Catalog.is(result.value.data.value)).toBe(true)
        } else {
          expect(Op.isSome(result.value.data)).toBe(true) // This will fail if data is None
        }
      }
    }
  }
}))

// ============================================================================
// File System Input Sources (Future Effect Implementation)
// ============================================================================

// These tests demonstrate what we'll test when Effect is implemented
type FileSystemInput = {
  diskLayout: Record<string, string>
  sourceType: 'file' | 'directory' | 'versionedDirectory'
  config: any
}
type FileSystemOutput = {
  expected: {
    isApplicable: boolean
    catalogType?: 'unversioned' | 'versioned'
    versionCount?: number
    revisionCount?: number
  }
}

// dprint-ignore
testWithFileSystem<FileSystemInput, FileSystemOutput>('File System Input Sources (Future)', [
  // File source cases
  { n: 'file source - missing file',
    i: { diskLayout: {}, sourceType: 'file', config: { path: '/project/schema.graphql' } },
    o: { expected: { isApplicable: false } },
    todo: 'Implement with Effect FileSystem' },

  { n: 'file source - existing file',
    i: { diskLayout: { '/project/schema.graphql': sdl1 }, sourceType: 'file', config: { path: '/project/schema.graphql' } },
    o: { expected: { isApplicable: true, catalogType: 'unversioned', revisionCount: 1 } },
    todo: 'Implement with Effect FileSystem' },

  { n: 'file source - non-graphql file',
    i: { diskLayout: { '/project/schema.txt': sdl1 }, sourceType: 'file', config: { path: '/project/schema.txt' } },
    o: { expected: { isApplicable: false } },
    todo: 'Implement with Effect FileSystem' },

  // Directory source cases
  { n: 'directory source - missing directory',
    i: { diskLayout: {}, sourceType: 'directory', config: { path: '/project/schema' } },
    o: { expected: { isApplicable: false } },
    todo: 'Implement with Effect FileSystem' },

  { n: 'directory source - empty directory',
    i: { diskLayout: { '/project/schema/.gitkeep': '' }, sourceType: 'directory', config: { path: '/project/schema' } },
    o: { expected: { isApplicable: false } },
    todo: 'Implement with Effect FileSystem' },

  { n: 'directory source - invalid file names',
    i: { diskLayout: {
      '/project/schema/readme.md': '# Schema',
      '/project/schema/invalid.graphql': sdl1,
    }, sourceType: 'directory', config: { path: '/project/schema' } },
    o: { expected: { isApplicable: false } },
    todo: 'Implement with Effect FileSystem' },

  { n: 'directory source - valid date files',
    i: { diskLayout: {
      '/project/schema/2024-01-01.graphql': sdl1,
      '/project/schema/2024-02-01.graphql': sdl2,
    }, sourceType: 'directory', config: { path: '/project/schema' } },
    o: { expected: { isApplicable: true, catalogType: 'unversioned', revisionCount: 2 } },
    todo: 'Implement with Effect FileSystem' },

  // Versioned directory cases
  { n: 'versioned directory - missing directory',
    i: { diskLayout: {}, sourceType: 'versionedDirectory', config: { path: '/project/schema' } },
    o: { expected: { isApplicable: false } },
    todo: 'Implement with Effect FileSystem' },

  { n: 'versioned directory - invalid version names',
    i: { diskLayout: {
      '/project/schema/invalid/schema.graphql': sdl1,
      '/project/schema/readme.md': '# Schema',
    }, sourceType: 'versionedDirectory', config: { path: '/project/schema' } },
    o: { expected: { isApplicable: false } },
    todo: 'Implement with Effect FileSystem' },

  { n: 'versioned directory - valid versions',
    i: { diskLayout: {
      '/project/schema/1.0.0/schema.graphql': sdl1,
      '/project/schema/2.0.0/schema.graphql': sdl2,
      '/project/schema/3.0.0/schema.graphql': sdl3,
    }, sourceType: 'versionedDirectory', config: { path: '/project/schema' } },
    o: { expected: { isApplicable: true, catalogType: 'versioned', versionCount: 3 } },
    todo: 'Implement with Effect FileSystem' },

  { n: 'versioned directory - mixed valid/invalid',
    i: { diskLayout: {
      '/project/schema/1.0.0/readme.md': '# Version 1',
      '/project/schema/2.0.0/schema.graphql': sdl2,
    }, sourceType: 'versionedDirectory', config: { path: '/project/schema' } },
    o: { expected: { isApplicable: true, catalogType: 'versioned', versionCount: 1 } },
    todo: 'Implement with Effect FileSystem' },
], ({ i, o }) => Ef.gen(function* () {
  // Get the appropriate input source loader
  const sourceLoaders = {
    'file': Schema.InputSources.File.loader,
    'directory': Schema.InputSources.Directory.loader,
    'versionedDirectory': Schema.InputSources.VersionedDirectory.loader,
  }
  const source = sourceLoaders[i.sourceType]
  const context = { paths: createTestConfig().paths }

  // Test with memory file system
  const program = Ef.gen(function* () {
    const isApplicable = yield* source.isApplicable(i.config, context)
    expect(isApplicable).toBe(o.expected.isApplicable)

    if (o.expected.isApplicable && o.expected.catalogType) {
      const result = yield* source.readIfApplicableOrThrow(i.config, context)
      expect(result).not.toBe(null)
      expect(Catalog.is(result!)).toBe(true)

      if (o.expected.catalogType === 'versioned') {
        expect(result!._tag).toBe('CatalogVersioned')
        if (o.expected.versionCount !== undefined) {
          const versioned = result as Catalog.Versioned
          expect(HashMap.size(versioned.entries)).toBe(o.expected.versionCount)
        }
      } else {
        expect(result!._tag).toBe('CatalogUnversioned')
        if (o.expected.revisionCount !== undefined) {
          const unversioned = result as Catalog.Unversioned
          expect(unversioned.schema.revisions.length).toBe(o.expected.revisionCount)
        }
      }
    }
  })

  yield* program.pipe(Ef.provide(FsMemory.layer(i.diskLayout)))
}))

// ============================================================================
// Source Priority Tests
// ============================================================================

type SourcePriorityInput = {
  diskLayout: Record<string, string>
  config: Partial<Config.Config>
}
type SourcePriorityOutput = {
  expected: {
    isApplicable: boolean
    detectedSource: string
    catalogType: 'unversioned' | 'versioned'
  }
}

// dprint-ignore
testWithFileSystem<SourcePriorityInput, SourcePriorityOutput>('Source Priority (Future)', [
  { n: 'default priority - file over directory',
    i: { diskLayout: {
      '/project/schema.graphql': sdl1,
      '/project/schema/2024-01-01.graphql': sdl2,
    }, config: createTestConfig() },
    o: { expected: { isApplicable: true, detectedSource: 'file', catalogType: 'unversioned' } },
    todo: 'Implement with Effect FileSystem' },

  { n: 'custom priority - directory first',
    i: { diskLayout: {
      '/project/schema.graphql': sdl1,
      '/project/schema/2024-01-01.graphql': sdl2,
    }, config: {
      ...createTestConfig(),
      schema: { useSources: ['directory', 'file'] }
    } },
    o: { expected: { isApplicable: true, detectedSource: 'directory', catalogType: 'unversioned' } },
    todo: 'Implement with Effect FileSystem' },

  { n: 'fallback when first not applicable',
    i: { diskLayout: {
      '/project/schema/1.0.0/schema.graphql': sdl1,
    }, config: {
      ...createTestConfig(),
      schema: { useSources: ['file', 'versionedDirectory'] }
    } },
    o: { expected: { isApplicable: true, detectedSource: 'versionedDirectory', catalogType: 'versioned' } },
    todo: 'Implement with Effect FileSystem' },
], ({ i, o }) => Ef.gen(function* () {
  const fullConfig = createTestConfig(i.config)

  // Test with memory file system to simulate source priority
  const program = Ef.gen(function* () {
    const result = yield* Schema.loadOrNull(fullConfig)
    expect(Op.isSome(result)).toBe(true)

    // Note: This is a simplified test since we don't have access to which source was detected
    // In a full implementation, we would need the Schema.load function to return source info
    if (Op.isSome(result)) {
      expect(result.value.data).not.toBe(null)
      expect(Catalog.is(result.value.data!)).toBe(true)
    }

    if (Op.isSome(result) && o.expected.catalogType === 'versioned') {
      expect(result.value.data!._tag).toBe('CatalogVersioned')
    } else if (Op.isSome(result)) {
      expect(result.value.data!._tag).toBe('CatalogUnversioned')
    }
  })

  yield* program.pipe(Ef.provide(FsMemory.layer(i.diskLayout)))
}))
