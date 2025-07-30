import { Catalog } from '#lib/catalog/$'
import { Lifecycles } from '#lib/lifecycles/$'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
import { Effect } from 'effect'
import PROJECT_SCHEMA from 'virtual:polen/project/schema.json'

// ============================================================================
// Types
// ============================================================================

export type SchemaSource =
  | { type: 'none' }
  | VersionedSchemaSource
  | UnversionedSchemaSource

export interface VersionedSchemaSource {
  type: 'versioned'
  catalog: Catalog.Versioned.Versioned
  getVersions: () => Version.Version[]
  getRevisions: () => Revision.Revision[]
  getVersionRevisions: (version: Version.Version) => Revision.Revision[]
  getSchema: (version: Version.Version) => Schema.Versioned.Versioned | undefined
  getLifecycle: () => Promise<Lifecycles.Lifecycles>
  inner: {
    get: (version: string) => Promise<Schema.Versioned.Versioned | undefined>
    getLifecycle: () => Promise<Lifecycles.Lifecycles>
    manifest: {
      type: 'versioned'
      versions: readonly string[]
    }
  }
}

export interface UnversionedSchemaSource {
  type: 'unversioned'
  catalog: Catalog.Unversioned.Unversioned
  getRevisions: () => Revision.Revision[]
  getSchema: () => Schema.Unversioned.Unversioned
  getLifecycle: () => Promise<Lifecycles.Lifecycles>
  inner: {
    getLifecycle: () => Promise<Lifecycles.Lifecycles>
  }
}

// ============================================================================
// Implementation
// ============================================================================

function createVersionedSource(catalog: Catalog.Versioned.Versioned): VersionedSchemaSource {
  const getLifecycle = async () => {
    // Create lifecycles from the catalog data
    return Lifecycles.create(catalog)
  }

  const getSchema: VersionedSchemaSource['getSchema'] = (version) => {
    const entry = catalog.entries.find(e => Version.equivalence(e.schema.version, version))
    return entry?.schema
  }

  return {
    type: 'versioned',
    catalog,
    getVersions: () => catalog.entries.map(entry => entry.schema.version),
    getRevisions: () => catalog.entries.flatMap(entry => [...entry.revisions]),
    getVersionRevisions: (version: Version.Version) => {
      const entry = catalog.entries.find(e => Version.equivalence(e.schema.version, version))
      return entry ? [...entry.revisions] : []
    },
    getSchema,
    getLifecycle,
    inner: {
      get: async (versionStr: string) => {
        // Parse version string and find matching schema
        const versions = catalog.entries.map(e => e.schema.version)
        const version = versions.find(v =>
          Version.toString(v) === versionStr
          || (versionStr === 'latest' && catalog.entries[catalog.entries.length - 1]?.schema.version === v)
        )
        return version ? getSchema(version) : undefined
      },
      getLifecycle,
      manifest: {
        type: 'versioned' as const,
        versions: catalog.entries.map(e => Version.toString(e.schema.version)),
      },
    },
  }
}

function createUnversionedSource(catalog: Catalog.Unversioned.Unversioned): UnversionedSchemaSource {
  const getLifecycle = async () => {
    // Create lifecycles from the catalog data
    return Lifecycles.create(catalog)
  }

  return {
    type: 'unversioned',
    catalog,
    getRevisions: () => [...catalog.revisions],
    getSchema: () => catalog.schema,
    getLifecycle,
    inner: {
      getLifecycle,
    },
  }
}

function createSchemaSource(): SchemaSource {
  if (!PROJECT_SCHEMA) {
    return { type: 'none' }
  }

  // Create Bridge for incremental loading
  // In production, assets are served from the build output
  const catalogBridge = Catalog.Bridge({
    // Assets are loaded from the virtual module path
    // The actual loading is handled by the Bridge's IO layer
  })

  // Use Bridge.view() to get the catalog
  // This will load only what's needed from the persisted assets
  try {
    const catalog = Effect.runSync(catalogBridge.view())

    switch (catalog._tag) {
      case 'CatalogVersioned':
        return createVersionedSource(catalog)
      case 'CatalogUnversioned':
        return createUnversionedSource(catalog)
      default:
        return { type: 'none' }
    }
  } catch (error) {
    console.error('Failed to load schema catalog:', error)
    return { type: 'none' }
  }
}

// ============================================================================
// Export
// ============================================================================

export const schemaSource = createSchemaSource()
