import { describe, expect, it } from 'vitest'
import * as VersionedSchemaDirectory from './versioned-directory.js'

describe('VersionedSchemaDirectory', () => {
  it('should read Pokemon example versioned schemas', async () => {
    const result = await VersionedSchemaDirectory.readOrThrow({
      path: './examples/pokemon/schema',
    }, process.cwd())

    expect(result).not.toBeNull()
    expect(result?._tag).toBe('CatalogVersioned')
    expect(result?.entries).toHaveLength(3) // Should have 3 entries

    // Check the versions are in the correct order (newest first)
    // Version is an object with _tag and value properties
    expect(result?.entries[0]?.schema.version.value).toBe('3.0.0')
    expect(result?.entries[1]?.schema.version.value).toBe('2.0.0')
    expect(result?.entries[2]?.schema.version.value).toBe('1.0.0')

    // Verify that each entry has a schema
    expect(result?.entries[0]?.schema._tag).toBe('SchemaVersioned')
    expect(result?.entries[1]?.schema._tag).toBe('SchemaVersioned')
    expect(result?.entries[2]?.schema._tag).toBe('SchemaVersioned')
  })
})
