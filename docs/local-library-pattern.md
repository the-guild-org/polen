# Name Case

- Directories use kebab case (e.g., `my-lib/`)
- Files use kebab case (e.g., `my-lib.ts`)
- ESM and TS namespaces use pascal case (e.g., `MyLib`)

# Export Entrypoint

- About
  - The module that external consumers import from to access a library's public API
  - Varies based on library structure
- Definition by Structure
  - **Barrel**: Export Entrypoint is `$$.js`
  - **Namespace Simple**: Export Entrypoint is `$.js`
  - **Namespace Complex**: Export Entrypoint is `$.js` (shadows `$$.js` for external consumers)

# Importing From Library

- Rules
  - If a lib is Global then
    - Consumers must import from any of their available subpaths (no shadowing concept here):
      - namespace subpath (`#lib/a`)
      - barrel subpath (`#lib/a/a`)
  - If a lib is Nested, then
    - Consumers must import from its Export Entrypoint
    - A Namespace Export Module "shadows" a Barrel Export Module meaning
      - If both exist, consumers must import from Namespace Export Module
      - If only Barrel Export Module exists, consumers must import from it

# Library Structure: Barrel

- About: A lib with barrel interface
- Pattern: `<lib>/{Barrel Export Module, <lib>.ts}`
- Trigger: Has just a Barrel Export Module

# Library Structure: Namespace Simple

- About: A lib with a namespace interface and internally has exports coming from just one source module
- Pattern: `<lib>/{Namespace Export Module, <lib>.ts}`
- Trigger: Has just a Namespace Export Module
- Rules
  1. Has [Namespace Export Module](#module-type-namespace-export)
  1. Has Source Module named after lib

# Library Structure: Namespace Complex

- About: A lib with a namespace interface and internally has exports coming from multiple source modules
- Pattern: `<lib>/{Namespace Export Module, Barrel Export Module, ...modules}`
- Trigger: Has both namespace and barrel Export Module
- Rules
  1. Has [Namespace Export Module](#module-type-namespace-export)
  1. Has [Barrel Export](#module-type-barrel-export)

# Library Scope: Global

- About
  - Libraries at the root lib directory that are accessible project-wide
  - Configured via package.json imports for standardized access
- Rules
  1. Located at root lib directory (e.g., `/src/lib/foo/`)
  2. Imported via subpaths: `#lib/<name>`
  3. Cannot be imported by itself or its descendants
  4. Requires package.json configuration (see Package Configuration section)

# Library Scope: Nested

- About
  - Libraries contained within other libraries for domain-specific organization
  - Part of parent library's internal structure
- Rules
  1. Located inside another lib (e.g., `/src/lib/foo/bar/`)
  2. Imported using relative paths: `./bar/$.js`
  3. NEVER use subpaths for nested libs
  4. Can import from parent's source modules via relative paths
  5. Can import from global libs (except ancestors)
- Usage Heuristics
  1. **Indicators to use**
  - Module has many related exports: `createFoo`, `filterFoo`, `isFoo`, etc.
  - Domain cohesion benefits from namespacing: `Foo.create()` vs `createFoo()`
  - Complex internal structure with reusable components
  2. **Indicators to not use**
  - Grab bag of decoupled function, often pure: `{ a, b, c, d }`
  - Few exports
  - Temporary, experimental, or uncertain work

# Module Type: Exporting: Barrel Export

- About
  - Internal module that organizes and structures a library's exports
  - Acts as the aggregation point for all public APIs within the library
- Rules
  1. File name: `$$.ts`
  1. Import permissions:
     - Any source module within the lib
     - Direct child lib's Barrel Export (remix rule)
     - NOT from grandchild libs
  1. Export patterns:
     - Acts as the library's export interface
     - May create namespace exports: `export * as Name$ from './module.js'`
  1. Special case: In simple lib, `<lib>.ts` can import from child's Barrel Export

## Value-Namespace Relation

- About
  - Pattern for exporting a value and namespace that closely relate
  - Use case example: Have constructor and utilities but you don't want to use `Something.create()` style, instead wanting `create` function be the `Something` and the lesser used utilities accessed under a namespace. Similar to class statics, but tree shakable.
- Rules
  1. Primary export gets direct name
  2. Utilities grouped under `Name$` namespace
  3. Example:
  ```typescript
  // foo.ts
  export const Foo = ... // main export
  export const util1 = ...
  export const util2 = ...

  // $$.ts
  export { Foo } from './foo.js'
  export * as Foo$ from './foo.js' // utilities under Foo$

  // Consumer usage:
  import { LibName } from '#lib/lib-name'
  LibName.Foo() // main export
  LibName.Foo$.util1 // utility
  ```

# Module Type: Exporting: Namespace Export

- About
  - The external interface for consumers
- Rules
  1. Pattern:
     ```ts
     export * as LIB_NAME from 'TARGET'
     ```
  2. LIB_NAME is the namespace name for the library
  3. TARGET is either:
     - `./$$.js` for Namespace Complex libraries
     - `./LIB_NAME.js` for Namespace Simple libraries

# Module Type: Testing: Lib Test (`$.test.ts`)

- About
  - Validates the library's public interface from a consumer perspective
  - Ensures API is usable and well-designed
- Rules
  1. File name: `$.test.ts`
  2. Imports ONLY from library's [Export Entrypoint](#export-entrypoint): `import { LibName } from './$.js'` or `import { ... } from './$$.js'`
  3. Cannot import from internal modules
  4. Tests ONLY through [Export Entrypoint](#export-entrypoint) imports
  5. Acts as an external consumer
  6. Validates the public interface completeness

# Module Type: Testing: Test Fixture (`$.test.fixture.ts`)

- About
  - Provides reusable test data and utilities for the test suite
  - Centralized test data or utilities for declarative testing
- Rules
  1. File name: `$.test.fixture.ts`
  2. Imports ONLY from library's [Export Entrypoint](#export-entrypoint)
  3. Exports TypeScript namespace `Fx` (always `Fx`, not library name)
  4. Example:
  ```typescript
  export namespace Fx {
    export const testData = ...
  }
  ```

# Module Type: Testing: Module Test (`<module>.test.ts`)

- About
  - Unit tests for complex internal implementation details
  - Used sparingly when module complexity doesn't justify a nested library
- Rules
  1. File name: `<module>.test.ts` where `<module>` matches the tested module
  2. Can import from the module being tested and its dependencies
  3. For exceptionally complex modules not warranting nested lib
  4. Should be rare - consider if nested lib is needed
  5. Example use case: Complex algorithm with simple exports
  6. Indicates potential architectural smell if overused

# Module Type: Source Module

- About
  - Implementation modules containing the actual library code
  - Any `.ts` file not matching other module type patterns
- Rules
  1. TypeScript namespaces FORBIDDEN (except type-only)
  2. Import permissions:
     - Sibling source modules in same directory
     - Source modules in plain directories (relative paths)
     - Global libraries via `#lib/<name>`
     - Nested libraries via relative paths `./nested/$.js`
     - Parent source modules (for nested libs) via relative paths
  3. Import restrictions:
     - NEVER from own lib's [Export Entrypoint](#export-entrypoint) or [Barrel Export](#module-type-barrel-export)
     - NEVER from any test modules
     - NEVER nested libs via subpaths

# Plain Directory

- About
  - Organizational directories without library structure
  - Used for grouping related source modules
- Rules
  1. No [Namespace Export Module](#module-type-namespace-export) present
  2. Not a library, just file organization
  3. Source modules can import freely using relative paths

# Library: Imports

- About
  - Governs how libraries can import from each other
  - Standardizes import path conventions for different library types
- Rules
  1. **Global libs**: Use subpath imports `#lib/<name>`
  2. **Nested libs**: Use relative paths `./nested-lib/$.js`
  3. **Never use subpaths for nested libs**
  4. **From outside a lib**: ONLY import from lib's [Export Entrypoint](#export-entrypoint)
  5. **Between sibling libs**: Import from sibling's [Export Entrypoint](#export-entrypoint)
  6. **Parent lib → nested lib**: Import from nested lib's [Export Entrypoint](#export-entrypoint)
  7. **Nested lib → parent modules**: Use relative paths to specific modules
  - Global Library Exception
    - About
      - Special rules for global library imports to prevent circular dependencies
    - Rules
      1. ANY lib can import from global libs (except the global lib itself or its descendants)
      2. Example: In `lib/{a/{$.ts,a.ts,a2/{$.ts,a2.ts}}, b/{$.ts,b.ts}}`:
         - `a2.ts` CAN import from `#lib/b` (global lib)
         - `a2.ts` CANNOT import from `#lib/a` (ancestor)
         - `a.ts` CANNOT import from `#lib/a` (itself)
  - Remix
    - About
      - Allows strategic re-exporting and extension of library interfaces
      - Enables composition and customization of exports
    - Rules
      1. **Barrel Export can import from direct child lib's Barrel Export** to remix/reorganize
      2. Applies ONLY to direct children, not grandchildren
      3. **Simple lib**: `<lib>.ts` can also import from child's Barrel Export
      4. **Consumers MAY import from global lib's Barrel Export** to extend/remix
      5. Example:
      ```typescript
      // my-lib/$$.ts extending a global lib
      export * from '#lib/foo/foo' // re-export all internals
      export { myNewUtil } from './my-util.js' // add new exports
      ```

# Package Configuration: Subpath Imports

- About
  - Using Node.js subpath imports for global libraries
  - Supports consistent distinct global lib imports
- Rules
  1. Subpath mappings by library structure:

  | Library Structure | `#lib/<name>` | `#lib/<name>/<name>` |
  | ----------------- | ------------- | -------------------- |
  | Namespace Simple  | `$.js`        | N/A                  |
  | Barrel            | `$$.js`       | N/A                  |
  | Namespace Complex | `$.js`        | `$$.js`              |

  1. For Namespace Simple libraries:
     ```json
     {
       "imports": {
         "#lib/<name>": "./src/lib/<name>/$.js"
       }
     }
     ```
  1. For Barrel libraries:
     ```json
     {
       "imports": {
         "#lib/<name>": "./src/lib/<name>/$$.js"
       }
     }
     ```
  1. For Namespace Complex libraries:
     ```json
     {
       "imports": {
         "#lib/<name>": "./src/lib/<name>/$.js",
         "#lib/<name>/<name>": "./src/lib/<name>/$$.js"
       }
     }
     ```
  1. First mapping: Public interface (namespace or barrel based on structure)
  1. Second mapping (complex only): Internal access for remixing via [Barrel Export](#module-type-barrel-export)

## Library: Union ADT (Algebraic Data Type) Pattern

- About
  - Pattern for discriminated unions with multiple member types
  - Provides type-safe access to union members and constructors
  - Library name should match the ADT name (e.g., `lifecycle-event` lib for `LifecycleEvent` ADT)
- Rules
  1. Library directory name matches the ADT name in kebab-case
  2. Union definition imports members directly (not via [Barrel Export](#module-type-barrel-export))
  3. [Barrel Export](#module-type-barrel-export) exports members as namespaces
  4. Structure:
  ```
  /lib/lifecycle-event/
    ├── $.ts                    // export * as LifecycleEvent from './$$.js'
    ├── $$.ts                   // exports member namespaces
    ├── lifecycle-event.ts      // union definition
    ├── added.ts               // member
    └── removed.ts             // member
  ```
  - Implementation:
    ```typescript
    // lifecycle-event.ts
    import { Added } from './added.js' // direct import, not from $$.ts
    import { Removed } from './removed.js'
    export const LifecycleEvent = Schema.Union(Added, Removed)

    // $$.ts
    export * as Added from './added.js'
    export * from './lifecycle-event.js'
    export * as Removed from './removed.js'
    ```

# Examples

## Simple Library

```
/lib/mask/
  ├── $.ts          // export * as Mask from './mask.js'
  ├── mask.ts       // all implementation
  └── $.test.ts     // import { Mask } from './$.js'
```

## Complex Library

```
/lib/hydra/
  ├── $.ts          // export * as Hydra from './$$.js'
  ├── $$.ts         // organizes exports, may remix child libs
  ├── bridge/       // nested lib
  │   ├── $.ts
  │   ├── $$.ts
  │   └── bridge.ts
  ├── value/        // nested lib
  │   ├── $.ts
  │   └── value.ts
  └── $.test.ts     // import { Hydra } from './$.js'
```

## Global Library

```
/lib/file-router/
  ├── $.ts          // export * as FileRouter from './$$.js'
  ├── $$.ts         // exports all public APIs
  ├── route.ts      // route implementation
  ├── router.ts     // router implementation
  └── $.test.ts     // import { FileRouter } from './$.js'

// Consumed from anywhere (except within file-router itself):
import { FileRouter } from '#lib/file-router'
```

## Nested Library

```
/lib/hydra/
  ├── $.ts          // export * as Hydra from './$$.js'
  ├── $$.ts
  ├── bridge/       // nested lib
  │   ├── $.ts      // export * as Bridge from './$$.js'
  │   ├── $$.ts     // exports bridge functionality
  │   └── bridge.ts // implementation
  └── hydra.ts

// From outside hydra:
import { Hydra } from '#lib/hydra'
const bridge = Hydra.Bridge.create()

// From within hydra (e.g., in hydra.ts):
import { Bridge } from './bridge/$.js'
```

## Remixing

```
// Creating an extended version of a global library
/lib/my-extended-router/
  ├── $.ts          // export * as MyExtendedRouter from './$$.js'
  └── $$.ts

// my-extended-router/$$.ts
export * from '#lib/file-router/file-router'  // re-export all internals
export { myCustomRoute } from './custom-route.js'  // add new functionality

// Consumer gets everything:
import { MyExtendedRouter } from '#lib/my-extended-router'
MyExtendedRouter.createRoute()  // from original file-router
MyExtendedRouter.myCustomRoute()  // new functionality
```

# Counter Examples

## Importing from `./$.js` within the same lib

```typescript
INVALID:
// /lib/foo/bar.ts
import { Foo } from './$.js'  // Never import from own $.ts
```

```typescript
VALID:
// /lib/foo/bar.ts
import { something } from './baz.js'  // Import directly from sibling
```

## Using TypeScript namespaces in source modules (except type-only)

```typescript
INVALID:
// /lib/foo/foo.ts
export const Foo = ...
export namespace Foo {  // TS namespaces forbidden in source
  export const util = ...
}
```

```typescript
VALID:
// /lib/foo/foo.ts
export const Foo = ...
export const util = ...  // Export as separate const

// /lib/foo/$$.ts
export { Foo } from './foo.js'
export * as Foo$ from './foo.js'  // Namespace created in $$.ts
```

## Test modules importing from anything other than [Export Entrypoint](#export-entrypoint)

```typescript
INVALID:
// /lib/foo/$.test.ts
import { Foo } from './foo.js'          // Cannot import from internal modules
```

```typescript
VALID:
// /lib/foo/$.test.ts (in a Namespace library)
import { Foo } from './$.js'  // Import from Export Entrypoint

// /lib/bar/$.test.ts (in a Barrel library)
import { createBar } from './$$.js'  // Import from Export Entrypoint
```

## Using subpaths for nested lib imports

```typescript
INVALID:
// /lib/foo/bar.ts
import { Baz } from '#lib/foo/baz'  // Never use subpaths for nested libs
```

```typescript
VALID:
// /lib/foo/bar.ts
import { Baz } from './baz/$.js'     // Use relative paths for nested libs
import { Other } from '#lib/other'   // Use subpaths for global libs only
```

# ADT File Module Guide

## ADT Unions - Comprehensive Guide

### Overview

ADT (Algebraic Data Type) Unions are discriminated unions with multiple member types that provide type-safe access to union members and constructors. This is a specialized pattern used in Effect Schema for complex data modeling.

### Core Principles

- **ADT Level**
  - Choose a name using pascal case
  - Create a module:
    - named as `<self>.ts` using kebab case
    - Each member should be a file (NOT a directory) in the same directory
    - Each member should be re-exported as namespace from $$.ts using `export * as <MemberName> from './<member>.js'`
    - The union schema itself is exported from the main module file
    - Imports all members and exports a union schema of them
    - example `export const Catalog = Schema.Union(Versioned,Unversioned)` in `catalog.ts` under `catalog/` directory

- **Member Level**
  - Use `Schema.TaggedStruct` to define members
  - Each member is a single file (e.g., `versioned.ts`, `unversioned.ts`)
    - tag name: `<adt name><member name>` pascal case
    - naming of export schema in module: `<member name>` pascal case
    - example: `export const Versioned = Schema.TaggedStruct('CatalogVersioned', ...` in `versioned.ts` under `catalog/` directory

### ADT Union Directory Structure

```
src/lib/catalog/
├── $.ts          # export * as Catalog from './$$.js'  <-- ALWAYS points to $$.js when it exists
├── $$.ts         # export * as Versioned from './versioned.js'
│                 # export * as Unversioned from './unversioned.js'
│                 # export * from './catalog.js'
├── catalog.ts    # import { Versioned } from './versioned.js'
│                 # import { Unversioned } from './unversioned.js'
│                 # export const Catalog = Schema.Union(Versioned, Unversioned)
├── versioned.ts  # export const Versioned = Schema.TaggedStruct('CatalogVersioned', { ... })
└── unversioned.ts # export const Unversioned = Schema.TaggedStruct('CatalogUnversioned', { ... })
```

### ADT Import Patterns

**CRITICAL RULE**: For ADT unions, ALWAYS import ONLY from $.js (namespace), NEVER from $$.js (barrel)

```typescript
// ✅ CORRECT: Import ONLY from namespace
import { LifecycleEvent } from './lifecycle-event/$.js'
import { Lifecycle } from './lifecycle/$.js'

// ❌ WRONG: NEVER do this
import { Added, LifecycleEvent, Removed } from './lifecycle-event/$$.js'
import { ObjectType, InterfaceType, Lifecycle } from './lifecycle/$$.js'

// To access members, use the namespace pattern:
const added: LifecycleEvent.Added.Added = LifecycleEvent.Added.make({...})
const objectType: Lifecycle.ObjectType.ObjectType = Lifecycle.ObjectType.make({...})
```

### Correct ADT imports in consuming code

```typescript
// Import the union type from $.ts
import { LifecycleEvent } from './lifecycle-event/$.js'

// Import member namespaces from $$.ts
import { Added, Removed } from './lifecycle-event/$$.js'

// Use member types via namespace
const addedEvent: Added.Added = Added.make({ ... })
const removedEvent: Removed.Removed = Removed.make({ ... })
```

### ADT Factory Pattern

For discriminated unions, use the factory pattern to create members:

```typescript
// Define union
const MyUnion = Schema.Union(MemberA, MemberB)

// Create factory using EffectKit
const make = EffectKit.Schema.Union.make(MyUnion)

// Use with full type safety - tag determines fields and return type
const instanceA = make('MemberATag', {/* fields specific to MemberA */})
const instanceB = make('MemberBTag', {/* fields specific to MemberB */})
```

**Benefits:**

- Type-safe tag selection with autocomplete
- Automatic field inference based on tag
- No manual conditionals needed
- Single source of truth for union member creation

**Example with LifecycleEvent:**

```typescript
// Before: verbose manual approach
const createEvent = (type: 'Added' | 'Removed') => {
  const baseEvent = { schema, revision }
  return type === 'Added'
    ? LifecycleEvent.Added.make(baseEvent)
    : LifecycleEvent.Removed.make(baseEvent)
}

// After: clean factory approach
const createEvent = EffectKit.Schema.Union.make(LifecycleEvent.LifecycleEvent)
const added = createEvent('LifecycleEventAdded', { schema, revision })
const removed = createEvent('LifecycleEventRemoved', { schema, revision })
```

### Critical: Schema Make Constructor

**ALWAYS** use the schema's `make` constructor when manually constructing values:

```typescript
// ✅ CORRECT - Use schema.make
const revision = Revision.make({ date: '2024-01-15', version: '1.0.0' })

// ❌ WRONG - Manual object construction
const revision = { _tag: 'Revision', date: '2024-01-15', version: '1.0.0' }

// The make constructor ensures:
// - Type safety and validation
// - Proper tag assignment
// - Default values are applied
// - Transformations are executed
```

### ADT Library Rules Summary

1. **Library directory name** matches the ADT name in kebab-case
2. **Union definition** imports members directly (not via Barrel Export)
3. **Barrel Export** exports members as namespaces
4. **Namespace import pattern** for external consumers
5. **Factory pattern** for type-safe member creation
6. **Schema.make constructors** for all value creation

This comprehensive ADT pattern ensures type safety, maintainability, and consistent API design across complex discriminated union types.
