# Mission: Dehydrated Schema Projections for Hydra API

## Overview

Implement dehydrated schema projections in the Hydra API following Effect's schema projection pattern (like `encodedSchema`). The functionality already exists but needs proper type safety and API exposure.

## Core Problem

The `createDehydratedVariant` function in `src/lib/hydra/bridge/bridge.ts` (lines 22-66) creates dehydrated schemas but lacks type safety on the return type. The specs define the exact API needed: `makeDehydrated()` and `.dehydrate()` methods on hydratable schemas.

## Implementation Tasks

### Task 1: Add Dehydrated Schema Projection API

**File**: `src/lib/hydra/hydratable/hydratable.ts`
**Location**: Add to `HydratableProperties` interface (lines 144-151)

Add these methods to the `HydratableProperties` interface:

```typescript
export interface HydratableProperties<
  $Schema extends AnySchema,
  ___Decoded extends object = EffectKit.Schema.ArgDecoded<$Schema>,
  ___Encoded extends object = EffectKit.Schema.ArgEncoded<$Schema>,
  ___Keys extends HydratableConfigInput = HydratableConfigInput,
> {
  readonly [HydrationConfigSymbol]: Config

  // NEW: Dehydrated schema projection methods
  readonly makeDehydrated: MakeDehydratedFn<___Encoded, ___Keys>
  readonly dehydrate: DehydrateFn<___Decoded>
}
```

### Task 2: Define Type-Safe Dehydrated Types

**File**: `src/lib/hydra/hydratable/hydratable.ts`
**Location**: Add after existing type definitions (around line 160)

```typescript
// Dehydrated schema projection types
export type DehydratedSchema<
  $Schema extends AnySchema,
  ___Keys extends HydratableConfigInput = HydratableConfigInput,
> = S.Schema<
  _Dehydrated<EffectKit.Schema.ArgEncoded<$Schema>, ___Keys>,
  _Dehydrated<EffectKit.Schema.ArgEncoded<$Schema>, ___Keys>
>

export type MakeDehydratedFn<
  ___Encoded extends object,
  ___Keys extends HydratableConfigInput,
> = ___Keys extends readonly string[]
  ? ___Keys['length'] extends 0 ? () => _Dehydrated<___Encoded, ___Keys>
  : (
    keys: Ob.OnlyKeysInArray<___Encoded, [...___Keys]>,
  ) => _Dehydrated<___Encoded, ___Keys>
  : never

export type DehydrateFn<___Decoded extends object> = (
  value: ___Decoded,
) => _Dehydrated<___Decoded, any>
```

### Task 3: Implement Type-Safe createDehydratedVariant

**File**: `src/lib/hydra/bridge/bridge.ts`
**Location**: Replace existing `createDehydratedVariant` function (lines 22-66)

Enhance the existing function with proper return type safety:

```typescript
const createDehydratedVariant = <$Schema extends Hydratable.Hydratable>(
  hydratableSchema: $Schema,
): Hydratable.DehydratedSchema<$Schema, Hydratable.ArgKeys<$Schema>> => {
  // Keep existing implementation but add type safety
  // ... existing logic ...

  return S.Struct(fields) as Hydratable.DehydratedSchema<
    $Schema,
    Hydratable.ArgKeys<$Schema>
  >
}
```

### Task 4: Implement Schema Projection Methods

**File**: `src/lib/hydra/hydratable/hydratable.ts`
**Location**: Add implementation in `Hydratable` function (lines 389-464)

```typescript
export function Hydratable<
  schema extends AnyStruct | AnyAdt | SingletonSchema,
  const $Options extends Options = OptionsWithDefualts,
>(
  schema: schema,
  options?: $Options,
): Hydratable<schema, $Options> {
  // ... existing validation logic ...

  // Store in annotations
  const annotatedSchema = schema.annotations({
    [HydrationConfigSymbol]: config,
  })

  // NEW: Add dehydrated projection methods
  const makeDehydrated = (keys?: any) => {
    if (config._tag === 'HydratableConfigSingleton') {
      // Generate hash for singleton
      return {
        _tag: EffectKit.Schema.TaggedStruct.getTagOrThrow(annotatedSchema),
        _dehydrated: true,
        hash: generateSingletonHash(keys, annotatedSchema),
      }
    } else if (config._tag === 'HydratableConfigStruct') {
      return {
        _tag: EffectKit.Schema.TaggedStruct.getTagOrThrow(annotatedSchema),
        _dehydrated: true,
        ...keys,
      }
    }
    throw new Error('ADT dehydration not yet implemented')
  }

  const dehydrate = (value: any) => {
    return Value.dehydrate(annotatedSchema)(value)
  }

  // Attach methods to schema
  Object.defineProperty(annotatedSchema, 'makeDehydrated', {
    value: makeDehydrated,
    writable: false,
    enumerable: false,
    configurable: false,
  })

  Object.defineProperty(annotatedSchema, 'dehydrate', {
    value: dehydrate,
    writable: false,
    enumerable: false,
    configurable: false,
  })

  return annotatedSchema as any
}
```

### Task 5: Add Comprehensive Tests

**File**: `src/lib/hydra/$.test.ts`
**Location**: Add new test section

```typescript
describe('Dehydrated Schema Projections', () => {
  describe('makeDehydrated', () => {
    test('singleton hydratable', () => {
      const SingletonSchema = Hydratable(
        S.TaggedStruct('Single', { value: S.String }),
      )

      const dehydrated = SingletonSchema.makeDehydrated()

      Ts.assertExact<{
        _tag: 'Single'
        _dehydrated: true
        hash: string
      }>()(dehydrated)

      expect(dehydrated._tag).toBe('Single')
      expect(dehydrated._dehydrated).toBe(true)
      expect(typeof dehydrated.hash).toBe('string')
    })

    test('struct with unique keys', () => {
      const UserSchema = Hydratable(
        S.TaggedStruct('User', {
          id: S.String,
          name: S.String,
          email: S.String,
        }),
        { keys: ['id'] },
      )

      const dehydrated = UserSchema.makeDehydrated({ id: 'user-123' })

      Ts.assertExact<{
        _tag: 'User'
        _dehydrated: true
        id: string
      }>()(dehydrated)

      expect(dehydrated).toEqual({
        _tag: 'User',
        _dehydrated: true,
        id: 'user-123',
      })
    })
  })

  describe('dehydrate', () => {
    test('dehydrates hydrated value', () => {
      const UserSchema = Hydratable(
        S.TaggedStruct('User', { id: S.String, name: S.String }),
        { keys: ['id'] },
      )

      const hydrated = { _tag: 'User', id: 'user-123', name: 'John' }
      const dehydrated = UserSchema.dehydrate(hydrated)

      expect(dehydrated).toEqual({
        _tag: 'User',
        _dehydrated: true,
        id: 'user-123',
      })
    })
  })

  describe('type safety', () => {
    test('prevents invalid keys in makeDehydrated', () => {
      const UserSchema = Hydratable(
        S.TaggedStruct('User', { id: S.String, name: S.String }),
        { keys: ['id'] },
      )

      // Should compile
      UserSchema.makeDehydrated({ id: 'valid' })

      // Should NOT compile (uncomment to test)
      // UserSchema.makeDehydrated({ name: 'invalid' })
      // UserSchema.makeDehydrated({ id: 'valid', extra: 'invalid' })
    })
  })
})
```

### Task 6: Export Dehydrated Type Helper

**File**: `src/lib/hydra/hydratable/$$.ts`
**Location**: Add export

```typescript
export * from './hydratable.js'
export * from './options.js'

// NEW: Export type helper for consumers
export type Dehydrated<$Schema extends Hydratable> = $Schema extends
  Hydratable<infer __schema__, infer __keys__>
  ? _Dehydrated<EffectKit.Schema.ArgEncoded<__schema__>, __keys__>
  : never
```

## Context and Existing Code

### Key Files

- **`src/lib/hydra/bridge/bridge.ts`**: Contains `createDehydratedVariant` (lines 22-66) - the core implementation
- **`src/lib/hydra/hydratable/hydratable.ts`**: Main hydratable schema interface and combinator
- **`src/lib/hydra/value/value.ts`**: Contains value-level dehydration (separate concern)
- **`specs/hydra.md`**: Complete specification defining the API

### Existing Types

- `_Dehydrated<___Encoded, $Keys>` (lines 153-159): Type-level dehydrated representation
- `DehydratedPropertiesStatic` (lines 161-163): Static properties for dehydrated values
- `HydratableProperties` (lines 144-151): Interface that needs the new methods

### Critical Notes

1. **Value vs Schema Dehydration**: These are completely different concepts. This mission is about **schema projections only**.
2. **Minimal New Code**: Most functionality exists - just needs proper typing and API exposure.
3. **Follow Effect Pattern**: Mirror Effect's `encodedSchema` pattern for consistency.
4. **Type Safety**: The main work is making `createDehydratedVariant` return type-safe schemas.

## Expected Outcome

After implementation:

```typescript
// Consumer can get dehydrated schema projection
const UserSchema = Hydratable(
  S.TaggedStruct('User', { id: S.String, name: S.String }),
  { keys: ['id'] },
)

// Type-safe dehydrated value creation
const dehydrated = UserSchema.makeDehydrated({ id: 'user-123' })
// Type: { _tag: 'User', _dehydrated: true, id: string }

// Type-safe dehydration of hydrated values
const hydrated = { _tag: 'User', id: 'user-123', name: 'John' }
const dehydratedCopy = UserSchema.dehydrate(hydrated)

// Type helper for consumers
type DehydratedUser = Dehydrated<typeof UserSchema>
```

## Success Criteria

1. All type errors resolved with full type safety
2. API matches hydra.md specifications exactly
3. Comprehensive tests pass (both type-level and value-level)
4. Zero breaking changes to existing code
5. Consumer API is clean and follows Effect patterns
