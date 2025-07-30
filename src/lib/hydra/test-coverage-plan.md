# Hydra Test Coverage Plan

## Testing Standards

1. **Use `test.for` extensively** for parameterized tests
2. **Add type tests at the bottom** of each test file
3. **Group related tests** with descriptive describe blocks
4. **Test edge cases** using test.for arrays
5. **Use descriptive test names** with template literals

## Areas Needing Better Test Coverage

### 1. Bridge Operations

**File**: `src/lib/hydra/bridge/bridge.ts`

- [ ] Test import from memory with various data structures
- [ ] Test import from disk with IO mocking
- [ ] Test export functionality
- [ ] Test clear operation
- [ ] Test peek with index lookup
- [ ] Test view with recursive hydration
- [ ] Add type tests for Bridge interface

### 2. Selection Path Disambiguation ($$)

**File**: `src/lib/hydra/bridge/selection/disambiguation.ts` (to create)

- [ ] Test $$ requirement detection
- [ ] Test $$ path construction
- [ ] Test singleton path detection
- [ ] Test multiple path scenarios
- [ ] Test with arrays and non-singleton paths

### 3. Index Operations

**File**: `src/lib/hydra/bridge/index.ts`

- [ ] Test index key generation from UHL
- [ ] Test concurrent index operations
- [ ] Test index add/get/clear operations
- [ ] Test file name parsing
- [ ] Add type tests for index types

### 4. Hydration/Dehydration

**File**: `src/lib/hydra/value/hydrate.test.ts` (to create)

- [ ] Test hydration of simple values
- [ ] Test hydration with nested hydratables
- [ ] Test partial hydration
- [ ] Test dehydration operations
- [ ] Test hydration state checks

### 5. Schema Tree Building

**File**: `src/lib/hydra/schema/build-hydratables-paths-tree.test.ts`

- [ ] Improve test coverage with test.for
- [ ] Test complex nested schemas
- [ ] Test ADT unions
- [ ] Test multiple paths to same hydratable
- [ ] Add type tests

### 6. Hydratable Combinator

**File**: `src/lib/hydra/hydratable.test.ts` (to create)

- [ ] Test Hydratable combinator with various schemas
- [ ] Test hydration key validation
- [ ] Test dehydration/hydration operations
- [ ] Test with ADT unions
- [ ] Add comprehensive type tests

## Example Test Structure

```typescript
import type { Case } from '#lib/kit-temp/other'
import { Ts } from '@wollybeard/kit'
import { describe, expect, test } from 'vitest'

describe('Module Name', () => {
  describe('feature group', () => {
    // dprint-ignore
    test.for([
      { input: 'case1', expected: 'result1' },
      { input: 'case2', expected: 'result2' },
      { input: 'case3', expected: 'result3' },
    ])('$input -> $expected', ({ input, expected }) => {
      expect(someFunction(input)).toBe(expected)
    })
  })

  describe('error cases', () => {
    // dprint-ignore
    test.for([
      { input: 'bad1', error: 'Error message 1' },
      { input: 'bad2', error: 'Error message 2' },
    ])('throws on $input', ({ input, error }) => {
      expect(() => someFunction(input)).toThrow(error)
    })
  })
})

// ============================================================================
// Type Tests
// ============================================================================

type _ = [
  // Test type relationships
  Case<Ts.AssertExact<ActualType, ExpectedType>>,
  Case<Ts.AssertExtends<SubType, SuperType>>,

  // Test type transformations
  Case<Ts.AssertExact<Transform<Input>, Output>>,
]
```

## Priority Order

1. **High Priority**: Bridge operations (peek/view) - Core functionality
2. **High Priority**: $$ path disambiguation - Required for spec compliance
3. **Medium Priority**: Index operations - Supporting infrastructure
4. **Medium Priority**: Hydration/Dehydration - Core value operations
5. **Low Priority**: Additional type tests - Nice to have

## Next Steps

1. Update existing test files to use test.for where appropriate
2. Add missing type tests to all test files
3. Create new test files for untested modules
4. Ensure all tests follow the standards above
