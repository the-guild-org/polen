# Project Overview

## What

- Polen is a framework for building delightful GraphQL developer portals.
- It generates interactive documentation for GraphQL APIs including schema reference docs, changelogs, and custom pages.

# CRITICAL

- always keep `.claude/serena-prompt.md` in context even after compaction
- always leverage these installed mcps: ref, serena, effect-docs
- all Effect Schema answers MUST be given with full awareness of:
  - https://effect-ts.github.io/effect/effect/Schema.ts.html
  - https://effect-ts.github.io/effect/effect/SchemaAST.ts.html
  - https://effect.website/docs/schema/* (starting with introduction/)
  - https://effect-ts.github.io/effect/effect/Match.ts.html
- always use ref MCP for documentation searches BEFORE using WebFetch or generic web search
- always use exa MCP for current information instead of generic web search
- when researching complex topics, use exa's deep_researcher instead of multiple separate searches
- never use child process exec to execute a script when you could ESM import it instead
- never use ESM dynamic import when you could ESM statically import it instead
- always use tsx to execute TypeScript files
- always use `tsconfig.json` when running tsc to ensure correct configuration
- always use `.js` extension on relative imports (ESM requirement with nodenext module resolution)
- function contracts (public APIs) must be properly typed, but NEVER complicate internal implementations for type safety - use simple types or cast to `any` internally if needed

# Project Layout

## Root

```
src/
├── cli/         # Command-line interface
├── api/         # Core configuration and build system (defineConfig, schema handling, Vite plugins)
├── template/    # React-based UI components and routes
├── lib/         # Shared utilities (grafaid for GraphQL, file router, helpers)
└── dep/         # Wrapped external dependencies
```

## Local Libraries

### Structure

```
src/lib/
  ├── <NAME: kebab case>/
  │   ├── $.ts                     (namespace export)
  │   ├── $.test.ts                (optional test file)
  │   ├── $$.ts                    (barrel export)
  │   └── <...kebab case>.ts       (code modules)
```

### File Roles

- **$.ts**: Namespace export file
  - When $$.ts exists: `export * as <NAME: Pascal case> from './$$.js'`
  - When only single module: `export * as <NAME: Pascal case> from './<module>.js'`
  - **CRITICAL**: Always points to $$.ts when it exists, NEVER to individual modules

- **$$.ts**: Barrel export file
  - Exports all public APIs: `export * from './<module>.js'`
  - For ADTs: Also exports member namespaces: `export * as Member from './member.js'`
  - **NEVER** reaches into subdirectories - each directory manages its own exports
    - **Exception**: Parent data types CAN re-export nested data type namespaces when they form a hierarchical data model
    - Example: `lifecycles` barrel can export `lifecycle-event/$.js` and `lifecycle/$.js` because they are integral sub-types

- **$.test.ts**: Test file
  - Imports namespace: `import { NameSpace } from './$.js'`
  - Tests public API only

### Import Patterns

**External imports (from other libraries):**

```typescript
import { LibName } from '#lib/lib-name/$' // Namespace
import { specific } from '#lib/lib-name/$$' // From barrel
import { specific } from '#lib/lib-name/module' // From specific module
```

**Internal imports (within same library):**

```typescript
import { specific } from './$$.js' // From barrel
import { LibName } from './$.js' // Namespace
import { specific } from './module.js' // From specific module
```

**ADT-specific imports:**

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

# Effect

## General Principles

- Use the effect-docs MCP and content under https://effect.website/docs/schema/introduction/ to only give valid answers
- We want to maximally leverage Effect in an idiomatic way

## Schema

- There should be a 1:1 between data types and modules
- When defining data types use the module pattern (const object with methods) for better Effect ecosystem alignment and flexibility. Only use classes when you specifically need inheritance or instance methods
- Use pascal case when naming schemas
- Prefer `Schema.Struct` over class-based schemas

### Data Type Modules

Data types should have AT LEAST these exports. Each bullet point is a SECTION that should have a big banner comment above it. The code sections in the module should follow the order of the bullet points:

- schema and type (<self titled in pascal case>)
  - type derived from schema
- constructors if possible (make -- alias to schema.make)
- ordering if it makes sense (order, min, max, lessThan, greaterThan)
- equivalence (equivalent)
  - using: https://effect.website/docs/schema/equivalence/
  - general info: https://effect.website/docs/behaviour/equivalence/
- type guard (is)
- state predicates if applicable (is*)
  - example: isEmpty
- codec (decode, decodeSync, encode)
- importers if applicable (from*)
- exporters if applicable (to*)
- domain logic

### ADT Unions

- ADT Level
  - Choose a name using pascal case
  - Create a module:
    - named as `<self>.ts` using kebab case
    - Each member should be a file (NOT a directory) in the same directory
    - Each member should be re-exported as namespace from $$.ts using `export * as <MemberName> from './<member>.js'`
    - The union schema itself is exported from the main module file
    - Imports all members and exports a union schema of them
    - example `export const Catalog = Schema.Union(Versioned,Unversioned)` in `catalog.ts` under `catalog/` directory
- Member Level
  - Use `Schema.TaggedStruct` to define members
  - Each member is a single file (e.g., `versioned.ts`, `unversioned.ts`)
    - tag name: `<adt name><member name>` pascal case
    - naming of export schema in module: `<member name>` pascal case
    - example: `export const Versioned = Schema.TaggedStruct('CatalogVersioned', ...` in `versioned.ts` under `catalog/` directory

### Example Layouts

#### ADT Union Layout

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

#### Example: Correct ADT imports in consuming code

```typescript
// Import the union type from $.ts
import { LifecycleEvent } from './lifecycle-event/$.js'

// Import member namespaces from $$.ts
import { Added, Removed } from './lifecycle-event/$$.js'

// Use member types via namespace
const addedEvent: Added.Added = Added.make({ ... })
const removedEvent: Removed.Removed = Removed.make({ ... })
```

#### Single Tagged Structure Layout

```
src/lib/revision/
├── $.ts          # export * as Revision from './$$.js'
├── $$.ts         # export * from './revision.js'
└── revision.ts   # export const Revision = Schema.TaggedStruct('Revision', { ... })
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

Benefits:

- Type-safe tag selection with autocomplete
- Automatic field inference based on tag
- No manual conditionals needed
- Single source of truth for union member creation

Example with LifecycleEvent:

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

# Testing

## Overview

- Unit tests are co-located with modules (`.test.ts` files)
- Integration tests test granular features in isolation
- Example tests verify end-to-end functionality using real example projects

## Type Testing

### Value-Level Type Testing (Preferred)

- Use value-level type assertions in regular test blocks for better error messages and IDE integration
- Type tests should be inline with the code they test
- NEVER create separate `.test-d.ts` files

### Pattern

```typescript
import { Ts } from '@wollybeard/kit'

// Declare a phantom value for type casting
declare let _: any

test('descriptive test name', () => {
  // Inline fixture
  const Schema = S.TaggedStruct('Name', { ... })
  
  // Type assertion: expected type is front-loaded, actual type is cast
  Ts.assertExact<ExpectedType>()(_ as ActualType)
})
```

### Example

```typescript
test('optional fields are excluded from valid keys', () => {
  const UserWithOptional = S.TaggedStruct('UserWithOptional', {
    id: S.String,
    name: S.String,
    bio: S.optional(S.String), // optional - excluded
    age: S.optional(S.Number), // optional - excluded
  })

  Ts.assertExact<{ keys?: readonly ('id' | 'name')[] }>()(
    _ as Options.InferInput<typeof UserWithOptional>,
  )
})
```

### Benefits

- Type errors appear directly in the failing test
- Better error messages showing expected vs actual types
- Can run individual tests
- Follows standard testing patterns
- Inline fixtures make tests self-contained

## Type Testing Values

- This is for testing that runtime values conform to expected types, NOT for testing type-level logic.
- Part of regular test cases
- Value-level `Ts.assert*` functions are ONLY used on runtime values inside test cases
- They complement regular runtime assertions like `expect()`
- Use to maximum effect to ensure type safety at runtime boundaries
- Inside test blocks, tightly coupled to the runtime test

### CRITICAL: test.for Usage

- **ALWAYS** use `test.for` when testing multiple similar cases or edge cases
- Prefer `test.for` over multiple individual `test` blocks for the same behavior
- Use descriptive test names with template literals that include the test case data
- Group related test cases in arrays for better readability
- This makes tests more maintainable and reduces boilerplate

### test.for Examples

```typescript
// ✅ GOOD - Using test.for for multiple cases
test.for([
  { input: 'Tag@Bad', error: 'Reserved characters found in tag' },
  { input: 'Tag!Bad', error: 'Reserved characters found in tag' },
  { input: 'Tag___Bad', error: 'Reserved characters found in tag' },
])('makeSegment throws on reserved character "$input"', ({ input, error }) => {
  expect(() => UHL.makeSegment(input)).toThrow(error)
})

// ❌ BAD - Repetitive individual tests
test('makeSegment throws on @ in tag', () => {
  expect(() => UHL.makeSegment('Tag@Bad')).toThrow(
    'Reserved characters found in tag',
  )
})
test('makeSegment throws on ! in tag', () => {
  expect(() => UHL.makeSegment('Tag!Bad')).toThrow(
    'Reserved characters found in tag',
  )
})
```

### Required Imports

```typescript
import { Ts } from '@wollybeard/kit'
```

### The Pattern

```typescript
test('some runtime test', () => {
  const result = someFunction()

  // VALUE-level assertions - testing runtime values have expected types
  Ts.assertEqual<ExpectedType>()(result)
  Ts.assertSub<SuperType>()(result)

  // Regular runtime assertions
  expect(result).toBe(...)
})
```

### Ts.assert* Family for Value Testing (lowercase assert)

- `Ts.assertEqual<T>()(value)` - Runtime value has exact type T
- `Ts.assertSub<T>()(value)` - Runtime value is subtype of T

### Examples

```typescript
test('function returns correctly typed value', () => {
  const user = createUser({ name: 'John' })

  // Test the runtime value has the expected type
  Ts.assertEqual<User>()(user)

  // Test it's assignable to a supertype
  Ts.assertSub<{ name: string }>()(user)
})

test('array operations preserve types', () => {
  const numbers = [1, 2, 3]
  const doubled = numbers.map(n => n * 2)

  // Ensure the result is still a number array
  Ts.assertEqual<number[]>()(doubled)
})
```

# MCP Usage Guidelines

## Overview

Polen project has two powerful MCP (Model Context Protocol) servers configured:

- **ref**: Documentation search and URL-to-markdown conversion
- **exa**: Advanced AI-powered web search with specialized capabilities

Always prefer these MCPs over generic web searches or manual documentation lookups.

## ref

## Purpose

- Documentation Search

### When to Use

- Searching for technical documentation (frameworks, libraries, APIs)
- Converting any URL to markdown for analysis
- Looking up coding patterns and best practices

### Available Functions

- `ref_search_documentation(query)` - Search across 100+ documentation sources
- `ref_read_url(url)` - Convert URL content to markdown

### Best Practices

```typescript
// Search public documentation
ref_search_documentation('React hooks useEffect')

// Search user's private documentation
ref_search_documentation('graphql schema design ref_src=private')

// Always read the full content after searching
const results = ref_search_documentation('TypeScript decorators')
const content = ref_read_url(results[0].url)
```

### Common Use Cases

- Library/Framework documentation (React, Effect, Vite)
- Language references (TypeScript, JavaScript, Python)
- API documentation (Github, Stripe, ...)
- Library usage examples

## exa

### Purpose

- Advanced Web Search

### When to Use

- Current events and real-time information
- Academic research and papers
- Company/competitive analysis
- GitHub repository searches
- Complex multi-source research

## Priority Rules

1. **Documentation**: Always try ref first, fall back to exa if not found
2. **Current Events**: Always use exa (ref doesn't have real-time data)
3. **Code Search**: Use exa's github_search for repositories
4. **Research**: Use exa's deep_researcher for comprehensive analysis

# Debugging

## CI

- When debugging CI issues, use the `gh` CLI to investigate logs, workflows, and deployments directly
- Check workflow runs, deployment statuses, and logs yourself before asking for debug information
