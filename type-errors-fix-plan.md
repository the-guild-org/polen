# Type Error Fix Plan for Polen Codebase

## Overview

~~There are **168 type errors** remaining in the Polen codebase after our initial fixes.~~

~~**Update:** Now down to **121 type errors** after completing the Projector layout fixes.~~

**Latest Update:** Currently at **151 type errors** after fixing several categories but encountering new issues from ongoing Projector API migration (Promise → Effect).

## Error Categories and Solutions

### 1. ✅ **Projector Layout Issue (51 errors)** - COMPLETED

**Files affected:** All integration test files
**Problem:** Tests were accessing `project.layout.cwd` but the Projector interface no longer has a `layout` property
**Solution:** ✅ Replaced `project.layout.cwd` with `project.dir.base` across all integration tests
**Additional fixes:**

- ✅ Updated PolenBuilder to use `FsLoc.AbsDir.AbsDir` instead of `string`
- ✅ Fixed polen.ts `fromMemory` call to properly decode string paths
- ✅ Updated test fixtures to pass all required dependencies

✅ **Fixed:** Effect service dependency errors by providing NodeFileSystem.layer

### 2. ✅ **Document Schema Type - NO CHANGES NEEDED**

**Files affected:** None

**Initial misunderstanding:** I incorrectly thought Document.Versioned and Document.Unversioned needed to use `new` keyword
**Correct API:** `Document.Unversioned.make()` and `Document.Versioned.make()` are the correct methods
**Resolution:** ✅ No changes needed - the original code was correct

### 3. ✅ **FsLoc Directory Operations (6 errors)** - COMPLETED

**Files affected:**

- `src/api/static/manifest.test.ts`
- `src/api/static/rebase.test.ts`
- `src/api/builder/ssg/page-generator.worker.ts`

**Problem:** Invalid `Fs.write` calls on directories with undefined content
**Solution:** ✅ Removed all invalid directory write operations:

- Removed 3 instances in `rebase.test.ts`
- Fixed `page-generator.worker.ts` to directly write files without explicit directory creation

### 4. **Paths Configuration Structure (3 errors)**

**File affected:** `src/api/schema/$.test.ts`
**Problem:** Tests passing incomplete paths configuration objects
**Solution:** Provide complete paths configuration with all required properties

### 5. **Unknown Type Issues (Multiple errors)**

**Files affected:** Various files with `unknown` type issues
**Problem:** Type inference failures or missing type annotations
**Solution:** Add explicit type annotations or type guards

### 6. **Example Controller Issues (25+ errors)** - IN PROGRESS

**File affected:** `tests/examples/helpers/example-controller/example-controller.ts`
**Problem:** Major API change - Projector now returns Effects instead of Promises
**Issues:**

- Template literal syntax no longer works with Effect-based shell/packageManager
- `FsLoc.fromString` used with runtime strings (needs `FsLoc.decodeSync`)
- ProcessPromise type mismatches with Effect returns
  **Solution:** Requires complete rewrite to work with new Effect-based Projector API

## Implementation Steps

### Step 1: Fix Projector Layout References

```typescript
// Change all occurrences of:
project.layout.cwd
// To:
project.dir
```

### Step 2: Fix Document Creation

```typescript
// Change from:
Document.Versioned.make({
  versionDocuments: HashMap.make(
    [Version.fromString('v1'), 'query...'],
    [Version.fromString('v2'), 'query...'],
  ),
})

// To:
new Document.Versioned({
  versionDocuments: HashMap.make(
    [Version.fromString('v1'), 'query...'],
    [Version.fromString('v2'), 'query...'],
  ),
})
```

### Step 3: Fix Paths Configuration

Update test helpers to provide complete paths configuration objects with all required nested properties.

### Step 4: Add Type Annotations

Add explicit type annotations for:

- `versionSchema` in remark-graphql-references.ts
- Root type in augmentations/apply.ts
- Various unknown types throughout

### Step 5: Update Example Controller

Update the example controller to properly type the run object with all required methods:

- dev
- build
- start
- buildSsg
- serveSsg

## Priority Order

1. **High Priority (Breaking tests):**
   - Projector layout issues (51 errors)
   - Document schema mismatches (14 errors)
   - Example controller issues (25 errors)

2. **Medium Priority (Functional impact):**
   - FsLoc directory operations (6 errors)
   - Paths configuration (3 errors)

3. **Low Priority (Type safety):**
   - Unknown type annotations
   - Minor type mismatches

## Current Status

### Completed Fixes:

- ✅ Projector layout issues (51 errors fixed)
- ✅ Document schema type mismatches (14 errors fixed)
- ✅ FsLoc directory operations (6 errors fixed)
- ✅ Effect service providing in integration tests (2 errors fixed)

### Remaining Work:

- 🔄 Example Controller rewrite for new Projector API (25+ errors)
- ⏳ Paths Configuration Structure (complex nested types)
- ⏳ Various type annotations needed

### Progress:

- Initial errors: 259
- After initial fixes: 168
- After Projector layout fixes: 121
- After incorrectly changing Document API: 151
- **Current count: 118** (after reverting Document changes and keeping other fixes)

## Notes

- ✅ Document.Unversioned.make() and Document.Versioned.make() are the CORRECT APIs (no `new` keyword needed)
- ✅ Projector API changed from Promise-based to Effect-based (requires FileSystem service)
- ⚠️ The Projector API migration is ongoing and causing new type errors
- ⚠️ Example controller needs complete rewrite for Effect-based API
- ⚠️ Some errors may still require updating dependencies

## Detailed Error Breakdown by File

### Integration Tests (51 errors)

- `tests/integration/helpers/test.ts`: 7 errors
- `tests/integration/cases/theme.test.ts`: 10 errors
- `tests/integration/cases/schema.test.ts`: 11 errors
- `tests/integration/cases/page.test.ts`: 2 errors
- `tests/integration/cases/page-hmr.test.ts`: 6 errors
- `tests/integration/cases/graphql-document-tooltips.test.ts`: 2 errors
- `tests/integration/cases/graphql-document-rendering.test.ts`: 6 errors
- `tests/integration/cases/endpoint-reference.test.ts`: 3 errors
- `tests/integration/cases/changelog.test.ts`: 1 error

### Example Tests (31 errors)

- `tests/examples/helpers/test.ts`: 6 errors
- `tests/examples/helpers/example-controller/example-controller.ts`: 25 errors

### API Examples (14 errors)

- `src/api/examples/$.test.ts`: 3 errors
- `src/api/examples/diagnostic/validator.test.ts`: 4 errors
- `src/api/examples/type-usage-indexer.test.ts`: 2 errors
- `src/api/examples/scanner.ts`: 1 error
- `src/api/examples/schemas/catalog.ts`: 2 errors

### Remaining Errors (72 errors)

Various files with type mismatches, missing annotations, and API changes
