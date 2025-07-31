# Hydra Bridge Architecture & State Management

## Core Concepts

### Fragments

A **fragment** is a hydratable stored on disk in its shallow hydrated form:

- Contains all the hydratable's own data (encoded form)
- Any nested hydratables are replaced with dehydrated references
- This allows lazy loading of deeply nested structures

Example fragment for `Schema!version@1.0.0.json`:

```json
{
  "_tag": "Schema",
  "version": "1.0.0",
  "definition": { "_tag": "Definition", "_dehydrated": true, "id": "def1" }
}
```

### Value States

| State                  | Description                                                 | Example                                                                                           |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Fully Dehydrated**   | Only tag, unique keys, and `_dehydrated: true`              | `{ _tag: "Schema", _dehydrated: true, version: "3.0.0" }`                                         |
| **Shallowly Hydrated** | Has all own data, but hydratable properties are dehydrated  | `{ _tag: "Schema", version: {v: "3.0.0"}, child: { _tag: "Child", _dehydrated: true, id: "1" } }` |
| **Partially Hydrated** | Some (but not all) direct/indirect hydratables are hydrated | See scenarios below                                                                               |
| **Fully Hydrated**     | All data present, all references hydrated                   | `{ _tag: "Schema", version: {v: "3.0.0"}, child: { _tag: "Child", id: "1", data: {...} } }`       |

**Key Insight**: Dehydrated values contain ONLY their identity (tag + unique keys). They do NOT contain references to child hydratables. When a hydratable is hydrated (even partially), it ALWAYS contains all its properties, but those properties may themselves be dehydrated references.

### Encoding States (Orthogonal to Hydration)

| State       | Description                             | Context                                          |
| ----------- | --------------------------------------- | ------------------------------------------------ |
| **Encoded** | Serialized form (for storage/transport) | JSON strings, transformed fields in encoded form |
| **Decoded** | Runtime JavaScript objects              | What's stored in INDEX, what app works with      |

## Stores & Their Contents

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│         INDEX                   │     │      BRIDGE TARGET (Disk)       │
├─────────────────────────────────┤     ├─────────────────────────────────┤
│ root: Decoded (any hydration)   │     │ Files: Encoded Fragments        │
│                                 │     │                                 │
│ fragments: Map<                 │     │ __root__.json                   │
│   UHL → Decoded (any hydration) │     │ Schema!version@3.0.0.json       │
│ >                               │     │ Product!sku@ABC.json            │
│                                 │     │                                 │
│ hasImported: boolean            │     │ (Fragments: shallow hydrated)   │
│ graph: DependencyGraph          │     │                                 │
└─────────────────────────────────┘     └─────────────────────────────────┘
```

## Key Operations

| Operation                | Input                    | INDEX Changes                                   | Disk Changes                            | Notes                                         |
| ------------------------ | ------------------------ | ----------------------------------------------- | --------------------------------------- | --------------------------------------------- |
| `importFromMemory(data)` | Decoded + Fully Hydrated | root = data<br>fragments += located hydratables | None                                    | Populates index with all hydratables found    |
| `import()`               | None                     | fragments += parsed JSON<br>root = parsed root  | None                                    | Loads dehydrated values from disk             |
| `export()`               | None                     | None                                            | Writes all fragments as dehydrated JSON | Dehydrates on-the-fly during export           |
| `view()`                 | None                     | None                                            | None                                    | Returns fully hydrated root (hydrates all)    |
| `peek(selection)`        | Selection query          | fragments += selected items                     | None                                    | Returns partially hydrated based on selection |

## Scenarios

### Scenario 1: Basic Import/Export Cycle

```typescript
// Given: Catalog → Schema → Definition
const data = {
  _tag: "Catalog",
  schema: {
    _tag: "Schema", 
    version: {v: "1.0.0"},
    definition: { _tag: "Definition", types: [...] }
  }
}

// Step 1: importFromMemory(data)
INDEX: {
  root: data (Fully Hydrated),
  fragments: {
    "Schema!version@1.0.0": { _tag: "Schema", version: {v: "1.0.0"}, definition: {...} },
    "Schema!version@1.0.0___Definition!id@def1": { _tag: "Definition", types: [...] }
  }
}

// Step 2: export()
DISK: {
  "__root__.json": { _tag: "Catalog", schema: { _tag: "Schema", _dehydrated: true, version: "1.0.0" } },
  "Schema!version@1.0.0.json": { _tag: "Schema", version: "1.0.0", definition: { _tag: "Definition", _dehydrated: true, id: "def1" } },
  "Schema!version@1.0.0___Definition!id@def1.json": { _tag: "Definition", id: "def1", types: [...] }
}
```

### Scenario 2: Incremental Loading with peek()

```typescript
// Given: A → B → C → D chain on disk
// User calls: peek({ A: true, B: true, C: true })

// Step 1: Load A from disk
INDEX.fragments['A!id@1'] = {
  _tag: 'A',
  id: '1',
  b: { _tag: 'B', _dehydrated: true, id: '2' },
}
// A is Shallowly Hydrated

// Step 2: Load B from disk
INDEX.fragments['B!id@2'] = {
  _tag: 'B',
  id: '2',
  c: { _tag: 'C', _dehydrated: true, id: '3' },
}
// B is Shallowly Hydrated

// Step 3: Load C from disk
INDEX.fragments['C!id@3'] = {
  _tag: 'C',
  id: '3',
  d: { _tag: 'D', _dehydrated: true, id: '4' },
}
// C is Shallowly Hydrated (contains dehydrated reference to D)

// Result: Partially Hydrated structure
// - A, B, C have their own data
// - D remains dehydrated reference
```

### Scenario 3: Mixed Hydration States

```typescript
// After import() from disk with some manual hydration
INDEX: {
  root: {
    _tag: "App",
    users: [
      { _tag: "User", id: "1", profile: { _tag: "Profile", _dehydrated: true, userId: "1" } },
      { _tag: "User", id: "2", profile: { _tag: "Profile", userId: "2", bio: "..." } }
    ]
  },
  fragments: {
    "User!id@1": { _tag: "User", id: "1", profile: { _tag: "Profile", _dehydrated: true, userId: "1" } },
    "User!id@2": { _tag: "User", id: "2", profile: { _tag: "Profile", userId: "2", bio: "..." } },
    "Profile!userId@1": { _tag: "Profile", _dehydrated: true, userId: "1" }, // Dehydrated in fragments
    "Profile!userId@2": { _tag: "Profile", userId: "2", bio: "..." }          // Hydrated in fragments
  }
}

// State Analysis:
// - root: Partially Hydrated (mix of hydrated/dehydrated)
// - User 1: Shallowly Hydrated
// - User 2: Fully Hydrated  
// - Profile 1: Fully Dehydrated
// - Profile 2: Fully Hydrated
```

### Scenario 4: view() Resolution Process

```typescript
// Given: INDEX with mixed hydration states (from Scenario 3)

// view() process:
1. Encode root → converts to encoded form with dehydrated refs
2. Apply transformed schema → accepts unions of hydrated|dehydrated  
3. Decode → validates and returns typed result

// During decode, the transformed schema handles:
- { _tag: "Profile", _dehydrated: true, userId: "1" } ✓ (matches dehydrated variant)
- { _tag: "Profile", userId: "2", bio: "..." } ✓ (matches hydrated variant)

// Result: Fully decoded structure with mixed hydration
```

## State Transitions

```
                Fully Dehydrated
            (disk representation)
                     ↓
import() ←──────────┤├───────────→ peek(selection)
    ↓                                    ↓
Dehydrated                          Partially
in INDEX                            Hydrated
    ↓                                    ↓
hydrate()                           hydrate()
    ↓                                    ↓
Fully Hydrated ←─────────────────────────┘
(importFromMemory)
    ↓
dehydrate()
    ↓
export() → Fully Dehydrated (disk)
```

## Key Insights

1. **INDEX is hydration-agnostic**: Can store values in any hydration state
2. **Disk is always fully dehydrated**: Only stores minimal representations
3. **Dehydration happens during export**: Not stored in dehydrated form in INDEX
4. **Hydration is progressive**: Can load and hydrate incrementally via peek()
5. **Schema transformation enables flexibility**: Unions accept both hydrated and dehydrated forms
6. **Encoding is orthogonal**: Separate concern from hydration state

## Singleton Hydratables: A Nuanced Topic

### The Problem with Singleton Hydratables

A "singleton hydratable" is a hydratable with no natural unique keys. This creates a fundamental problem: where do we store the data when dehydrated?

#### Anti-Pattern: Container Structs as Singleton Hydratables

```typescript
// ❌ BAD: Container struct with no unique keys
const SchemaUnversioned = Hydra.Hydratable(
  S.TaggedStruct('SchemaUnversioned', {
    revisions: S.Array(Revision.Revision),
    definition: SchemaDefinition,
  }),
  // No keys parameter - this is a singleton!
)
```

Problems:

- When dehydrated: `{ _tag: 'SchemaUnversioned', _dehydrated: true }`
- All data (revisions, definition) is lost!
- No unique key means no way to store/retrieve the data separately

#### Proper Pattern: Scalar Values with Content-Based Keys

```typescript
// ✅ GOOD: Large scalar with hash-based key
const SchemaDefinition = Hydra.Hydratable(
  S.transformOrFail(
    S.String, // SDL string
    S.instanceOf(GraphQLSchema),
    {
      decode: (sdl) => buildSchema(sdl),
      encode: (schema) => printSchema(schema),
    },
  ),
  { keys: ['hash'] }, // Use content hash as unique key
)

// The schema would include a hash field
const SchemaDefinitionWithHash = S.Struct({
  sdl: S.String,
  hash: S.String, // Hash.string(sdl)
})
```

Benefits:

- Dehydrated: `{ _tag: 'SchemaDefinition', _dehydrated: true, hash: 'abc123' }`
- Data stored in: `SchemaDefinition!hash@abc123.json`
- Content deduplication: identical schemas share the same file

### Domain Modeling Guidelines

1. **Container structs should NOT be hydratables** unless they have natural unique keys
   - Example: `CatalogVersioned` ✅ (has version key)
   - Example: `SchemaUnversioned` ❌ (no keys - should be a regular struct)

2. **Large scalar values CAN be hydratables** with synthetic keys
   - Use content hash for immutable data
   - Use timestamp/UUID for mutable data
   - This enables lazy loading of heavy content

3. **Think of it like scalar identity**
   - For a scalar like `5`, the value IS the identity
   - For large content, use a hash of the content as identity
   - This is why singleton hydratables only make sense for scalars

### Technical Implementation with Effect

Effect provides hashing utilities through the `Hash` module:

```typescript
import { Hash } from 'effect'

// Transform to add hash field
const withHash = S.transform(
  S.String,
  S.Struct({
    content: S.String,
    hash: S.String,
  }),
  {
    decode: (content) => ({
      content,
      hash: Hash.string(content).toString(),
    }),
    encode: ({ content }) => content,
  },
)
```

This approach ensures that singleton-like hydratables have proper unique keys based on their content.

### Implemented Solution

The Hydra system now automatically handles singleton hydratables:

1. **Detection**: When `Hydratable()` is called with no keys, it enters singleton mode
2. **Validation**: Only scalars or transformations with scalar encoding are allowed
3. **Hash Generation**: Uses Effect's `Hash` module to generate content-based keys
4. **Storage**: Singleton hydratables are stored with hash-based UHLs (e.g., `SchemaDefinition!hash@123456`)

Example usage:

```typescript
// Define a singleton hydratable (transformation with scalar encoding)
const SchemaDefinitionHydratable = Hydratable(
  S.transformOrFail(
    S.String, // SDL string (scalar encoding)
    S.instanceOf(GraphQLSchema),
    {
      decode: (sdl) => buildSchema(sdl),
      encode: (schema) => printSchema(schema),
    },
  ),
  // No keys parameter - automatically enters singleton mode
)

// When dehydrated, it becomes:
// { _tag: 'SchemaDefinition', _dehydrated: true, hash: '123456' }
// Stored in: SchemaDefinition!hash@123456.json
```

## Critical Issue: Property References

**Current Limitation**: The schema transformation only handles hydratables themselves becoming unions, but doesn't transform properties that reference hydratables.

Example of the problem:

```typescript
// Original
type C = {
  _tag: 'C'
  data: string
  d: D // Reference to hydratable D
}

// Current transformation (INCOMPLETE)
type C_Transformed = C | C_Dehydrated

// What we actually need
type C_Transformed = {
  _tag: 'C'
  data: string
  d: D | D_Dehydrated // Property must also be union!
} | C_Dehydrated
```

Without this fix, partially hydrated values will fail schema validation when they contain dehydrated references.
