# Migration Plan: routes-manifest.ts to Catalog Bridge Pattern

## Current Implementation Analysis

The current `routes-manifest.ts` Vite plugin manually:

1. Reads `schema.manifest.json` to determine schema type (versioned/unversioned)
2. Manually parses schema JSON files to extract types and fields
3. Generates routes by manually traversing the GraphQL AST using `visit`
4. Uses the Routes.Manifest API to write the final manifest

### Pain Points

- Manual file I/O operations
- Direct JSON parsing without validation
- Imperative AST traversal
- No type safety for schema structure
- Duplicated logic for versioned vs unversioned schemas

## Bridge-Based Implementation

### How Bridge Works with Catalog

The Bridge is created with `Catalog.CatalogHydratable` as its root schema:

```typescript
const CatalogBridge = Hydra.Bridge.makeMake(Catalog.CatalogHydratable)
const bridge = CatalogBridge({ dir: schemasDir })
```

Since Catalog is the root type, we can get the entire hydrated catalog with:

```typescript
// Import all hydrated data from disk
await bridge.import()

// Get the whole catalog
const catalog = await bridge.view()
// Returns the entire catalog (CatalogVersioned or CatalogUnversioned)
```

### Implementation

```typescript
export const RoutesManifest = (config: Config.Config): Vite.Plugin => {
  const debug = debugPolen.sub(`vite:routes-manifest`)

  // Create the Bridge factory for Catalog
  const CatalogBridge = Hydra.Bridge.makeMake(Catalog.CatalogHydratable)

  return {
    name: `polen:routes-manifest`,
    apply: `build`,
    applyToEnvironment: Vite.isEnvironmentSsr,
    async closeBundle() {
      const routes: string[] = []

      // Add base routes
      routes.push('/')
      routes.push('/changelog')

      // Create bridge instance pointing to schemas directory
      const bridge = CatalogBridge({
        dir: config.paths.project.absolute.build.assets.schemas,
      })

      // Import all hydrated schema data from disk
      const importResult = await Effect.runPromise(bridge.import())

      // Get the entire catalog
      const catalog = await Effect.runPromise(bridge.view())

      if (catalog) {
        routes.push('/reference')

        // Process catalog using pattern matching
        Catalog.fold(
          (versioned) => processVersionedCatalog(versioned, routes),
          (unversioned) => processUnversionedCatalog(unversioned, routes),
        )(catalog)
      }

      // Add custom page routes (existing logic)
      const pagesDir = config.paths.project.absolute.pages
      // ... existing page route logic ...

      // Write manifest
      await Api.Routes.Manifest.write(
        {
          version: `1.0.0`,
          timestamp: new Date().toISOString(),
          totalRoutes: routes.length,
          routes: routes.sort(),
        },
        config.paths.project.absolute.build.assets.root,
      )

      consola.success(`Generated routes manifest with ${routes.length} routes`)
    },
  }
}

function processVersionedCatalog(
  catalog: Catalog.Versioned.Versioned,
  routes: string[],
): void {
  for (const entry of catalog.entries) {
    const version = entry.schema.version
    routes.push(`/reference/version/${version}`)

    // Process schema definition
    processSchemaDefinition(
      entry.schema.definition,
      routes,
      `/reference/version/${version}`,
    )
  }
}

function processUnversionedCatalog(
  catalog: Catalog.Unversioned.Unversioned,
  routes: string[],
): void {
  // Process schema definition
  processSchemaDefinition(catalog.schema.definition, routes, '/reference')
}

function processSchemaDefinition(
  definition: SchemaDefinition,
  routes: string[],
  basePath: string,
): void {
  // Extract types from the schema definition
  // Note: We need to understand the structure of SchemaDefinition
  // to properly extract types and fields

  // Assuming SchemaDefinition has a types property with type definitions
  for (
    const [typeName, typeDefinition] of Object.entries(definition.types || {})
  ) {
    routes.push(`${basePath}/${typeName}`)

    // Handle fields for object/interface types
    if ('fields' in typeDefinition) {
      for (const fieldName of Object.keys(typeDefinition.fields)) {
        routes.push(`${basePath}/${typeName}/${fieldName}`)
      }
    }
  }
}
```

## Benefits

1. **Type Safety**: Full type safety through Effect Schema and Catalog types
2. **Declarative**: Uses Bridge pattern for data access
3. **Consistency**: Aligns with the codebase's Hydra Bridge architecture
4. **Error Handling**: Leverages Effect for consistent error handling
5. **No Manual Parsing**: Bridge handles all file I/O and JSON parsing

## Next Steps

1. Verify the structure of SchemaDefinition type and how it exposes types
2. Implement the route generation functions
3. Test with both versioned and unversioned catalogs
4. Handle error cases gracefully with Effect

## Key Insights

- The Bridge with Catalog as root schema can return the entire hydrated catalog with `view({})`
- This gives us the complete typed catalog structure to generate routes from
- We can use pattern matching with `Catalog.fold` to handle versioned vs unversioned cases
- The Bridge handles all the complexity of file storage and hydration
