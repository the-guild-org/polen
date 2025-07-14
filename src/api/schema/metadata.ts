/**
 * Schema metadata information
 */
export interface SchemaMetadata {
  /** Whether a schema is present in the project */
  hasSchema: boolean
  /** Array of available version identifiers */
  versions: string[]
}

export const getMetadata = async (path: string): Promise<SchemaMetadata> => {
  try {
    const metadata = await import(path, { with: { type: 'json' } })
    return metadata.default
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // No metadata file - no schemas available
      return { hasSchema: false, versions: [] }
    }
    // Re-throw any other errors
    throw new Error(`SSG failed to read schema metadata ${path}: ${error.message}`)
  }
}
