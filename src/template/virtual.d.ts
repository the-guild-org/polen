declare module 'virtual:polen/project/schema-metadata' {
  interface SchemaMetadata {
    hasSchema: boolean
    versions: string[]
  }
  const metadata: SchemaMetadata
  export default metadata
}
