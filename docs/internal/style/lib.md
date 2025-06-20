# Library Layout Style Guide

## Core Concept

Libraries follow a **namespace pattern** where:

- Each library exports a namespace object containing all its exports
- The namespace can be "opened" by extending the import path
- This mirrors how packages work: `import { Schema } from 'graphql'` vs `import { buildSchema } from 'graphql/schema'`

## File Structure

```
src/lib/
  └── <lib-name>/
      ├── $.ts          # Namespace export: export * as <LibName> from './$$.ts'
      ├── $$.ts         # Barrel export: export * from './*.ts' (excluding $ files)
      ├── *.test.ts     # Tests (import from namespace)
      └── *.ts          # Implementation modules
```

## Import Mappings

Configure in `package.json`:

```json
{
  "imports": {
    "#lib/<name>": "./src/lib/<name>/$.ts",
    "#lib/<name>/<name>": "./src/lib/<name>/$$.ts"
  }
}
```

## Usage Patterns

```ts
// Closed namespace - everything under one object
import { Mask } from '#lib/mask'
Mask.create(...) 
Mask.apply(...)

// "Open" the namespace by adding it to the import path
import { create, apply } from '#lib/mask/mask'
create(...)  // Direct access
```

## Naming Conventions

- `$` = Namespace (one thing)
- `$$` = Exports (many things)
- Library name in kebab-case
- Namespace name in PascalCase

## Rationale

- **Namespaces prevent naming collisions** and provide organization
- **Opening via import path** creates intuitive API: "I want mask's exports directly"
- **The `foo/foo` pattern** reinforces that you're "diving into" the namespace
- **Mirrors package conventions** like popular npm packages where you can either import the main package (`import { Schema } from 'graphql-tools'`) or access specific submodules (`import { makeExecutableSchema } from 'graphql-tools/schema'`). Effect is another example: `import { Effect } from 'effect'` for the namespace vs `import { pipe, map } from 'effect/Effect'` for specific functions
- **Better export names** by eliding the domain term - instead of `createMask`, `applyMask`, etc., you get cleaner names like `create`, `apply` when importing from the barrel

## Principles

1. **Self-contained**: Each lib is independent
2. **Predictable**: Same pattern for every lib
3. **Adjacent files**: $ and $$ sort together at top
4. **Manual subpaths**: Explicit entries per lib for the `foo/foo` pattern
5. **No central registry**: No root lib index file

## Example Implementation

### Creating a New Library

1. Create the directory structure:

```bash
mkdir -p src/lib/my-feature
```

2. Create the namespace file (`$.ts`):

```ts
export * as MyFeature from './$$.ts'
```

3. Create the barrel export file (`$$.ts`):

```ts
export * from './create.ts'
export * from './types.ts'
export * from './utils.ts'
```

4. Add import mappings to `package.json`:

```json
{
  "imports": {
    "#lib/my-feature": "./src/lib/my-feature/$.ts",
    "#lib/my-feature/my-feature": "./src/lib/my-feature/$$.ts"
  }
}
```

5. Create the test file (`$.test.ts`):

```ts
import { MyFeature } from './$.ts'

describe('create', () => {
  test('creates a feature', () => {
    const feature = MyFeature.create()
    expect(feature).toBeDefined()
  })
})
```

6. Use the library:

```ts
// Namespace import
import { MyFeature } from '#lib/my-feature'
MyFeature.create()

// Direct import
import { create } from '#lib/my-feature/my-feature'
create()
```

## Testing Conventions

### Standard Pattern

- **One test file per library**: `$.test.ts`
- **Test via namespace**: Import from `./$.ts`
- **Test public API only**: What users actually use
- **No top-level describe for library name**: Use describes for each export

### Example Test Structure

```ts
// $.test.ts
import { Mask } from './$.ts'

describe('create', () => {
  test('creates binary mask', () => {
    const mask = Mask.create(true)
    expect(mask.type).toBe('binary')
  })
})

describe('apply', () => {
  test('applies mask to data', () => {
    const mask = Mask.create(true)
    expect(Mask.apply('data', mask)).toBe('data')
  })
})
```

### Type Testing

- **Type test files**: Use `*.test-d.ts` for type-level tests
- **Type assertions**: Use kit's `Ts` namespace from `@wollybeard/kit`
- **Common assertions**: `Ts.AssertEqual`, `Ts.assertEqual`, `Ts.assertSub`
- **Test alongside runtime tests**: Place type tests next to regular test files
- **Testing type errors**: Use `@ts-expect-error` directive for invalid cases instead of commenting them out

#### Type Assertion Patterns

**Type-level assertions** (no value):

```ts
type Options = InferOptions<unknown>
type _Test = Ts.AssertEqual<
  Options,
  boolean | string[] | Record<string, boolean>
>
```

**Value-level assertions** (double parentheses):

```ts
const mask = Mask.create(true)
Ts.assertEqual<BinaryMask<unknown>>()(mask)
```

**Subtype assertions**:

```ts
const result = someFunction()
Ts.assertSub<ExpectedSupertype>()(result)
```

Example type test:

```ts
// mask.test-d.ts
import { Ts } from '@wollybeard/kit'
import { Mask } from './$.ts'
import type { BinaryMask, PropertiesMask } from './mask.ts'

// Test type-level function
{
  type Options = InferOptions<unknown>
  type _Test = Ts.AssertEqual<
    Options,
    boolean | string[] | Record<string, boolean>
  >
}

// Test value-level types
{
  const mask1 = Mask.create(true)
  const mask2 = Mask.create(['name', 'age'])

  // Value assertions need double parentheses
  Ts.assertEqual<BinaryMask<unknown>>()(mask1)
  Ts.assertEqual<PropertiesMask<object>>()(mask2)
}

// Test invalid cases
{
  type User = { name: string; age: number }

  // @ts-expect-error - 'invalid' is not a key of User
  const mask = Mask.create<User>(['invalid'] as any)
}
```

### Complex Modules

Only add `[module].test.ts` for complex implementations that warrant unit testing. Most libraries only need `$.test.ts`.

### Testing Principles

1. **Libraries are not applications** - No integration tests needed
2. **Test the interface** - Not the implementation details
3. **Keep it simple** - One test file is usually enough
4. **Public API focus** - Test what users will actually call
5. **No redundant describes** - Top-level describes for each export, not library name
6. **Property-based testing** - Prefer fast-check for comprehensive test coverage

### Property-Based Testing with fast-check

Use `fast-check` for testing functions with complex input domains or invariants:

```ts
import * as fc from 'fast-check'
import { test } from 'vitest'
import { MyLib } from './$.js'

test('function maintains invariant across all inputs', () => {
  fc.assert(
    fc.property(
      fc.string(),
      fc.integer(),
      (str, num) => {
        const result = MyLib.process(str, num)
        // Test invariants
        expect(result.length).toBeGreaterThan(0)
        expect(result).toContain(str)
      },
    ),
  )
})
```

**When to use property-based testing**:

- Functions with many edge cases
- Parser/serializer pairs (round-trip testing)
- Functions with mathematical properties
- Data transformations with invariants

**Benefits**:

- Finds edge cases you didn't think of
- Tests hundreds of inputs automatically
- Documents invariants in code
- Provides minimal failing examples

## Domain-Driven Module Organization

### Core Principle

**Colocate data types with their primary operations** - Types and the functions that construct or primarily operate on them should live in the same module.

### Module Naming

Modules should be named after their domain concept, not generic terms:

- ✅ `mask.ts` - Contains Mask type and create function
- ❌ `types.ts` - Too generic
- ✅ `report.ts` - Contains Report type and print functions
- ❌ `utils.ts` - Unclear domain

### Organization Pattern

```
lib-name/
  ├── $.ts              # Namespace export
  ├── $$.ts             # Barrel export
  ├── $.test.ts         # Tests via namespace
  ├── <domain>.ts       # Domain type + constructor/primary operations
  ├── <operation>.ts    # Secondary operations with their types
  └── internal.ts       # Shared internal utilities (optional)
```

### Decision Framework

**When to colocate type and function:**

- The function is the primary constructor for the type
- The function is the main operation for that type
- The type and function form a cohesive unit
- Example: `Mask` type + `create` function

**When to separate:**

- Operations that work on multiple types
- Secondary operations that could grow independently
- Operations with their own complex types
- Example: `apply` functions with `Apply` type

**When to use generic names:**

- `internal.ts` - For truly internal shared utilities
- Never use `types.ts`, `utils.ts`, `helpers.ts` at library root

### Examples

```typescript
// mask.ts - Domain object with constructor
export type Mask = ...
export type MaskOptions = ...
export const create = (options: MaskOptions): Mask => ...

// apply.ts - Operation domain with its types
export type Apply<D, M> = ...
export const apply = ...
export const applyPartial = ...

// report.ts - Another domain with operations
export type Report = ...
export const printReport = (report: Report) => ...
export const formatReport = (report: Report) => ...
```

### Benefits

1. **Intuitive imports** - Related items come from the same file
2. **Clear ownership** - Each module owns its domain
3. **Natural growth** - Modules earn their independence as they grow
4. **Reduced coupling** - Clear boundaries between domains
