# Hydra Bridge System Plan

## Overview

## Intro

The Hydra Bridge system is a declarative persistence layer that replaces Polen's manual asset generation with automatic, incremental hydration capabilities. It leverages the existing Hydra hydration/dehydration patterns to provide a unified interface for both build-time asset generation and runtime asset loading.

## Implementation Tips

- Write quality units (aka. modules, funcs, etc.) that are, for critical paths (low level base, abstract, complex, algorithm) are unit tested in isolation so that as you build up the system you can confidently isolate bugs, avoiding large gaps between problem manifestation and resolution.
- unit testing absolutely includes type level testing and you should use @wollybeard/kit export of Ts and then use its Ts.Assert* utiliteis combined with our local kit temp Case utility for writing succinct tests like we did in hydra so far
- All tests should be compact succinct abstravt and avoid verbosity of real domains that hide the patterns we're trying to cover
- All tests should when possible use centralized fixtures to keep test code smaller and focused

## Core Architecture

### 1. Bridge Factory Pattern

```typescript
// In data module (e.g., catalog/catalog.ts)
// Full robust type inference on `Bridge` based on the schema given
export const Bridge = Hydra.Bridge.make(CatalogHydratable)

// In application code
// New instance, schema already captured by closure
// Full robust type inference on `bridge`
// Configuration is provided only at instance creation time
const bridge = Catalog.Bridge.make({ basePath: '/assets' })
// Or use default:
const bridge = Catalog.Bridge.make()
```

The factory pattern captures the schema value AND type at definition time, eliminating the need to pass it at usage sites.

### 2. Bridge API

#### Core Operations

```typescript
interface Bridge<T extends Effect.Schema.Schema.All> {
  // Infrastructure operations
  import(): Effect<void, IOError, IO> // Load from disk (async)
  import(data: InferHydratedDataFromSchema<T>): void // Load from memory (sync, for bootstrap - requires fully hydrated data)
  export(options?: { basePath?: string }): Effect<void, IOError, IO> // Write to disk

  // User operations (type-safe)
  peek<selection extends InferBridgeSelectionFromSchema<T>>(
    selection: selection,
  ): Effect<InferDehydratedDataFromSelection<T, selection>, IOError, IO> // Get possibly-dehydrated
  view<selection extends InferBridgeSelectionFromSchema<T>>(
    selection: selection,
  ): Effect<InferHydratedDataFromSelection<T, selection>, IOError, IO> // Get fully-hydrated

  // State access
  readonly index: Record<IndexKey, object> // For debugging
}
```

#### Import Overloading

The overloaded `import` method solves the bootstrap problem:

- Build time: `bridge.import(catalog)` - Synchronous, loads from memory
- Runtime: `yield* bridge.import()` - Asynchronous Effect, loads from disk

### 3. Selection DSL

```typescript
type BridgeSelection = {
  // if NOT an adt union and NO dehydrated keys
  <data_type_name>: true
  // if NOT an adt union and HAS dehydrated keys
  <data_type_name>: {
    <unique_key>: <unique_value>, ...
    // if IS context dependent (see append algorithm)
    $<context>: BridgeSelection
  }
  // if IS an adt union
  <adt_name>: {
    // if NO dehydrated keys
    <member_name>: true
    // if HAS dehydrated keys
    <member_name>: {
      <unique_key>: <unique_value>, ...
      // if IS context dependent (see append algorithm)
      $<context>: BridgeSelection
    }
  }
}

// Examples:
{ foo: true }
{ catalog: { versioned: true } }
{ revision: { initial: { date: '2025-12-14', $schema: { versioned: { version: "123" } } } } }
{ schema: { versioned: { version: '1.0.0' } } }
```

See appendix for detailed algorithm

### 4. Bridge Naming

Grammar:
DATA_TYPE[___DATA_TYPE]*
DATA_TYPE = <<adt>@<adt_member>|<non_adt>>[_<key>@<val>]*

Examples:

Simple cases:
Index: foo
File: /foo.json

Index: catalog@versioned
File: /catalog@versioned.json

With context:
Index: schema@versioned_version@1.0.0___revision@initial_date@2025-12-14
File: /schema@versioned_version@1.0.0___revision@initial_date@2025-12-14.json

### 5. Bridge Index Structure

Index keys follow the naming pattern in (4)

```typescript
// Example index:
{
  'foo': Foo,
  'foo2___bar@qux': Foo2,
  'catalog@versioned': CatalogVersioned,
  'schema@versioned_version@1.0.0___revision@initial_date@2025-12-14': RevisionInitial,
  'schema@versioned___version@1.0.0': SchemaVersioned
}
```

### 6. Bridge Target Structure

- Follows the naming pattern in (4)
- But receives .json extension
- has an optional path prefix otherwise defaults to `/`

### 7. IO Service Layer

#### Interface

```typescript
interface IO {
  read: (relativePath: string) => Effect<unknown, IOError>
  write: (relativePath: string, data: unknown) => Effect<void, IOError>
}

const IO = Context.GenericTag<IO>('IO')
```

#### Base Path Configuration

```typescript
// At bridge construction
const bridge = Catalog.Bridge.make({ basePath: '/assets' })

// Or use default '/'
const bridge = Catalog.Bridge.make()

// Override at export time
yield * bridge.export({ basePath: '/build/assets' })
```

#### Environment-Specific Services

Note: IO Service is intentionally dumb - it only reads and writes. All path construction logic is owned by the Bridge.

```typescript
// Node.js
const LocalFileIO = (basePath: string) =>
  Layer.succeed(IO, {
    read: (path) =>
      Effect.tryPromise({
        try: () => fs.readFile(join(basePath, path), 'utf-8').then(JSON.parse),
        catch: (e) => new IOError({ type: 'read', path, cause: e }),
      }),
    write: (path, data) =>
      Effect.tryPromise({
        try: () =>
          fs.writeFile(join(basePath, path), JSON.stringify(data, null, 2)),
        catch: (e) => new IOError({ type: 'write', path, cause: e }),
      }),
  })

// Browser
const RemoteFileIO = (basePath: string) =>
  Layer.succeed(IO, {
    read: (path) =>
      Effect.tryPromise({
        try: () => fetch(join(basePath, path)).then(r => r.json()),
        catch: (e) => new IOError({ type: 'read', path, cause: e }),
      }),
    write: () =>
      Effect.fail(new IOError({ type: 'write', cause: 'Not supported' })),
  })
```

## Operation Semantics

### peek()

1. Check index for requested record
2. If found, return it (may be hydrated from previous operations)
3. If not found, load from IO and add to index
   1. If asset is missing, throw AssetNotFoundError
   2. Return it (definitely dehydrated)

### view()

1. Check index for requested record and all its relations recursively
2. For each missing or dehydrated item:
   1. Load from IO
   2. If asset is missing, throw AssetNotFoundError
   3. Update index
3. Return it (definitely hydrated)
4. Note: Circular references are handled naturally by JavaScript runtime

### import()

1. Memory variant: Populate index directly from provided data (requires fully hydrated data)
2. Disk variant: Load all assets from IO into index
3. Any schema mismatch between expected and loaded data throws SchemaVersionError

### export()

1. Write all records in index to IO as separate files
2. Use file naming convention
3. Respect basePath configuration
4. Note: Polen build/dev processes export all assets at once, not incrementally

## Type System Integration

### Selections

### Bridge Selection to Targets Mapping

Bridge selections map to targets for type transformation. See appendix for detailed algorithm.

### Relationship to Existing Targets System

- **Targets**: Controls hydration depth and validates shape
- **Bridge Selection**: Performs identity-based lookup
- **Shared**: Type-level `Hydrate` transformation

The systems remain separate but share type transformation machinery.

## Polen Integration

### Build Time

```typescript
// src/api/schema/assets.ts
import { buildCatalog } from './catalog'
import { loadSchemaInputs } from './inputs'

const generateAssets = () =>
  Effect.gen(function*(_) {
    // Load Polen schema inputs (existing)
    const inputs = yield* _(loadSchemaInputs())

    // Build catalog (existing)
    const catalog = yield* _(buildCatalog(inputs))

    // Export via bridge (new)
    const bridge = Catalog.Bridge.make()
    bridge.import(catalog) // Bootstrap from memory with fully hydrated data
    yield* _(bridge.export({ basePath: './build/assets' }))
    // This exports ALL assets at once - incremental features are not used during build
  }).pipe(Effect.provide(LocalFileIO))
```

### Client Runtime

```typescript
// src/template/sources/schema-source.ts
const bridge = Catalog.Bridge.make()

// Load catalog
const catalog = yield * pipe(
  bridge.peek({ catalog: { versioned: true } }),
  Effect.provide(RemoteFileIO('/assets')),
)

// Later, incrementally load schema (this is where incremental loading shines)
const schema = yield * bridge.view({
  schema: { versioned: { version: '1.0.0' } },
})
```

## Key Design Decisions

1. **Stateful Bridge**: Each instance maintains its own index for O(1) lookups
2. **Import Overloading**: Solves bootstrap problem elegantly
3. **Separate Systems**: Targets and selections serve different purposes
4. **ADT Organization**: Use explicit `adt: { name: string }` annotation on member schemas for detection
5. **Flat Structure**: Each record has single file reference
6. **Type Safety**: Full type inference for selections
7. **No Wildcards**: Default behavior is "select all"
8. **Immutable Records**: Once hydrated, records don't change
9. **Explicit Over Implicit**: ADT membership is declared via annotation rather than inferred from graph

## Migration Tasks

### Fix ADT Member Tags and Add Annotations

All existing tagged structs that are members of unions need to be updated with proper tags AND the `adt` annotation. This includes:

1. **Catalog Union Members** (already correct):
   - `CatalogVersioned` → add `.annotations({ adt: { name: 'Catalog' } })` ✓
   - `CatalogUnversioned` → add `.annotations({ adt: { name: 'Catalog' } })` ✓

2. **Schema Union Members** (INCORRECT TAGS - MUST FIX):
   - Change tag from `'Versioned'` to `'SchemaVersioned'` + add `.annotations({ adt: { name: 'Schema' } })`
   - Change tag from `'Unversioned'` to `'SchemaUnversioned'` + add `.annotations({ adt: { name: 'Schema' } })`
   - Update all references to these tags throughout the codebase

3. **Revision Union Members** (if applicable):
   - Check all revision-related unions and their members
   - Ensure tags follow the pattern: `<UnionName><MemberName>`

4. **Any other unions in lib**:
   - Scan for all `Schema.Union` usages
   - Fix any incorrect tag patterns
   - Add appropriate annotations to their members

This migration must be completed before the Bridge system can correctly generate asset file names.

# Appendix

## Algorithm: Minimum Unique Path to Record

Input

- Schema structure with hydratable types
- Target record type to uniquely identify

Output

- Minimum path from root to target that guarantees uniqueness

Algorithm

1. Build Schema Graph
   - Traverse schema AST to find all hydratable types
   - For each hydratable type, record:
   - Its path from root (e.g., catalog.entries.revisions)
   - Its dehydration keys (fields used for identity)
   - Whether it's a singleton (no dehydration keys)
2. Identify Target Ancestors
   - Given target type, find its path from root
   - Extract all ancestor types in the path
   - Example: For revision, ancestors are [catalog, schema]
3. Filter to Required Context
   - Start with empty context
   - For each ancestor (from root to parent):
   - If ancestor has dehydration keys → include in context
   - If ancestor is singleton → skip (not needed for uniqueness)
     - Result: Minimal set of ancestors needed for uniqueness
4. Build Selection Path
   - Start with target selection
   - For each required ancestor (in reverse order):
   - Wrap current selection with ancestor selection using $ prefix
     - Example:
       // Target: revision with date
       { date: '2025-12-14' }

// With required context (schema has version key)
{
date: '2025-12-14',
$schema: { versioned: { version: '1.0.0' } }
}
5. Generate Index Key

- Concatenate all path segments with ___
- Each segment: <type>@<member>[_<key>@<value>]*
- Example: schema@versioned_version@1.0.0___revision@initial_date@2025-12-14

Edge Cases

1. Global Uniqueness: If target has globally unique keys, no context needed
2. Multiple Parents: If type appears in multiple locations, throw error (not expected in current schemas)
3. Recursive Types: Track visited types to prevent infinite loops
4. Arrays: Treat array elements as requiring parent context

Completeness Proof

The algorithm is total because:

1. Schema graph is finite (no infinite schemas)
2. Path traversal terminates (acyclic due to leftmost rule)
3. Every hydratable type has a path from root
4. Dehydration keys are statically defined
5. Selection building is deterministic

Example Execution

Schema: Catalog → Schema → Revision

1. Build graph:
   - catalog: singleton (no keys)
   - schema: has key 'version'
   - revision: has key 'date'

2. Target: revision
   Ancestors: [catalog, schema]

3. Filter context:
   - catalog: singleton → skip
   - schema: has keys → include

4. Build selection:
   revision: { date: '2025-12-14', $schema: { version: '1.0.0' } }

5. Generate key:
   schema@versioned_version@1.0.0___revision@initial_date@2025-12-14

This algorithm guarantees the minimum path needed for global uniqueness while maintaining structural context.

### Union Type Handling in Path Selection

When a path traverses through a union type:

1. Each union member creates a distinct path branch with potentially different context requirements
   - Some branches may require context (have dehydration keys)
   - Other branches may not require context (singletons)
2. Type-level elision rule for unions:
   - If ANY branch of a union requires context (is not elidable), then the context field becomes REQUIRED in the
     selection type
   - This ensures type safety even though some runtime paths may elide the context
   - The selection type must accommodate the most restrictive case
3. Example:
   // Schema union where:
   // - versioned branch: requires version key
   // - unversioned branch: singleton (no keys)

// Selection type MUST include $schema because versioned branch needs it
type RevisionSelection = {
date: string
$schema: {
versioned?: { version: string }
unversioned?: true
}
}
4. Runtime behavior:

- Singleton branches are still elided in the final index key
- But the selection type requires the user to specify which branch they're taking

This ensures compile-time safety while maintaining runtime efficiency.

### Single-Key Selection Shorthand

Algorithm for supporting abbreviated selection syntax when a hydratable has exactly one dehydration key:

Type-Level Support

For any hydratable with a single dehydration key, the selection type becomes a union:
type Selection = KeyValue | { keyName: KeyValue }

// Example:
type VersionedSelection = string | { version: string }

Runtime Resolution Algorithm

1. Input Analysis
   - Check if selection value is a primitive (string, number, etc.) vs object
   - If primitive, proceed to key resolution
   - If object, use standard processing
2. Key Resolution for Primitives
   - Look up the hydratable schema for this selection path
   - Extract dehydration keys from schema
   - Validation:
   - If keys.length === 0: ERROR "Cannot use shorthand for singleton"
   - If keys.length === 1: Use this key name
   - If keys.length > 1: ERROR "Cannot use shorthand with multiple keys"
3. Transform to Standard Form
   - Convert primitive value to object form:
     // Input: '1.0.0'
     // Schema has single key: 'version'
     // Output: { version: '1.0.0' }
4. Continue Normal Processing
   - Process the normalized selection as usual

Examples

// These are equivalent:
{ schema: { versioned: '1.0.0' } }
{ schema: { versioned: { version: '1.0.0' } } }

// These are equivalent (with context):
{ revision: { initial: { date: '2025-12-14', $schema: { versioned: '1.0.0' } } } }
{ revision: { initial: { date: '2025-12-14', $schema: { versioned: { version: '1.0.0' } } } } }

// Error cases:
{ catalog: { versioned: 'oops' } } // ERROR: versioned is singleton (0 keys)
{ someType: { multiKey: 'value' } } // ERROR: multiKey has 2+ keys

Implementation Note

This transformation happens early in the selection processing pipeline, before path building or index key
generation. This ensures all downstream code works with normalized selections.

## ADT Member Detection Algorithm

Determines if a schema is part of an ADT (Algebraic Data Type) for naming purposes.

Requirements:

- ADT member tags MUST follow the pattern: `<ADTName><MemberName>`
- Example: For ADT 'Schema', members must be 'SchemaVersioned', 'SchemaUnversioned'
- Members with incorrect tags (e.g., 'Versioned' instead of 'SchemaVersioned') are considered bugs

Input

- Schema to check

Output

- Boolean indicating if schema is ADT member
- If true, the ADT name and member name

Algorithm

1. Check schema annotations for ADT marker
2. Extract ADT name from annotation
3. Extract member name by removing ADT prefix from tag

```typescript
// Annotation type
interface ADTAnnotation {
  adt: {
    name: string
  }
}

function isADTMember(
  schema: Schema.Schema.All,
): { isADT: boolean; adtName?: string; memberName?: string } {
  // Get annotations
  const annotations = Schema.annotations(schema)
  const adtAnnotation = annotations.adt as ADTAnnotation['adt'] | undefined

  if (!adtAnnotation?.name) return { isADT: false }

  // Get tag from schema
  const tag = getTagFromSchema(schema)
  if (!tag) return { isADT: false }

  // Verify tag starts with ADT name (required pattern)
  const adtName = adtAnnotation.name
  if (!tag.startsWith(adtName)) {
    throw new Error(
      `ADT member tag '${tag}' doesn't start with ADT name '${adtName}' - this is a bug`,
    )
  }

  // Extract member name
  const memberName = tag.slice(adtName.length)
  return { isADT: true, adtName, memberName }
}
```

Usage Example

```typescript
// Define ADT members with annotation
const CatalogVersioned = Schema.TaggedStruct('CatalogVersioned', {
  // fields...
}).annotations({
  identifier: 'CatalogVersioned',
  adt: { name: 'Catalog' },
})

const CatalogUnversioned = Schema.TaggedStruct('CatalogUnversioned', {
  // fields...
}).annotations({
  identifier: 'CatalogUnversioned',
  adt: { name: 'Catalog' },
})

// Create union
const Catalog = Schema.Union(CatalogVersioned, CatalogUnversioned).annotations({
  identifier: 'Catalog',
})
```

Result

- Check CatalogVersioned: { isADT: true, adtName: 'Catalog', memberName: 'Versioned' }
- File name: catalog@versioned.json

## Selection to Targets Transformation Algorithm

Converts Bridge selection DSL to Targets structure for hydration control.

Input

- Bridge selection object
- Schema for type information

Output

- Targets object with hydrate flags and children

Algorithm

1. For each key in selection:
   - If value is `true` → terminal node, set hydrate: true
   - If value is object → recurse into children
   - If key starts with $ → context reference, handle specially

2. Map selection structure to targets:
   ```typescript
   function selectionToTargets(selection: BridgeSelection): Targets {
     const targets: Targets = { hydrate: true, children: {} }

     for (const [key, value] of Object.entries(selection)) {
       if (key.startsWith('$')) {
         // Context reference - merge into current level
         const contextTargets = selectionToTargets(value)
         Object.assign(targets.children, contextTargets.children)
       } else if (value === true) {
         // Terminal selection
         targets.children[key] = { hydrate: true }
       } else if (typeof value === 'object') {
         // Nested selection
         targets.children[key] = selectionToTargets(value)
       }
     }

     return targets
   }
   ```

Example Transformation

Selection:

```typescript
{
  catalog: { versioned: true },
  schema: {
    versioned: {
      version: '1.0.0',
      $parent: { catalog: { versioned: true } }
    }
  }
}
```

Targets:

```typescript
{
  hydrate: true,
  children: {
    catalog: {
      hydrate: true,
      children: {
        versioned: { hydrate: true }
      }
    },
    schema: {
      hydrate: true,
      children: {
        versioned: {
          hydrate: true,
          children: {
            version: { hydrate: true },
            catalog: { // from $parent
              hydrate: true,
              children: {
                versioned: { hydrate: true }
              }
            }
          }
        }
      }
    }
  }
}
```

This transformation enables the existing hydration machinery to work with Bridge selections.

## Error Types

All errors use Effect's tagged error pattern:

```typescript
// Base error
class BridgeError extends Data.TaggedError<BridgeError>('BridgeError') {
  readonly details: unknown
}

// Specific errors
class AssetNotFoundError extends BridgeError {
  readonly _tag = 'AssetNotFoundError'
  readonly path: string
}

class SchemaVersionError extends BridgeError {
  readonly _tag = 'SchemaVersionError'
  readonly expected: unknown
  readonly actual: unknown
}

class InvalidSelectionError extends BridgeError {
  readonly _tag = 'InvalidSelectionError'
  readonly selection: unknown
  readonly reason: string
}

class MultiplePathsError extends BridgeError {
  readonly _tag = 'MultiplePathsError'
  readonly type: string
  readonly paths: string[][]
}
```
