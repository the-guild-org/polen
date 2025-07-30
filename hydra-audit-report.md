# Hydra Implementation Audit Report

## Executive Summary

This audit reveals critical issues in the Hydra implementation that must be fixed before Polen's schema versioning feature can work properly. The most critical issue is a tag mismatch between schema implementation and tests that will cause runtime failures.

## Critical Issues (Must Fix)

### 1. Schema Tag Mismatch - Runtime Failure Risk

**What**: Tests expect different tags than implementation provides

- Implementation uses: `'SchemaVersioned'` and `'SchemaUnversioned'`
- Tests expect: `'Versioned'` and `'Unversioned'`
- Template code expects: `'CatalogVersioned'` and `'CatalogUnversioned'` (lines 117-119 in schema-source.ts)

**Why**: This mismatch causes runtime decode/encode failures when loading schemas. The test assertions on lines 21 and 31 of `$.test.ts` will fail.

**Solution**:

- Option 1: Update tests to expect `'SchemaVersioned'` and `'SchemaUnversioned'`
- Option 2: Change implementation tags to match test expectations
- Must also align with Catalog tags which use `'CatalogVersioned'`/`'CatalogUnversioned'`

**Known**:

- Tests cannot currently run due to circular reference error
- Template code is looking for Catalog tags, not Schema tags

**Unknown**:

- Whether existing persisted data uses old or new tag format
- Which tag convention is correct (Schema* vs bare names)

### 2. Circular Reference Error in Schema Tests

**What**: Schema tests fail with "Cannot access 'VersionedBase' before initialization"

**Why**: Circular reference in `versioned.ts` where parent field references VersionedBase during its own definition

**Solution**:

- Fix the circular reference in the schema definition
- Consider using lazy evaluation or restructuring the parent field definition

**Known**:

- Error prevents all schema tests from running
- Issue is in the `S.suspend()` usage on line 38

## High Priority Issues

### 3. Bridge Factory Pattern Not Implemented

**What**: Plan specifies `Catalog.Bridge.make()` factory pattern, but not implemented

**Why**: Current `Bridge.makeMake()` pattern is verbose and error-prone (see line 90 in schema-assets.ts)

**Solution**:

- Add to catalog module: `export const Bridge = Hydra.Bridge.make(Catalog)`
- Update all usage sites to use the factory pattern
- Remove direct `makeMake` usage

**Known**:

- Pattern is documented in research/plan.md
- Current usage in schema-assets.ts line 90: `Bridge.makeMake(Catalog.Catalog)`

### 4. Bridge.view() Doesn't Handle Union Roots

**What**: `view()` assumes root is a simple hydratable, not a union like Catalog

**Why**: Current implementation only checks for single tag match, doesn't support ADT member selection

**Solution**:

- Implement proper union handling in `view()`
- Support ADT member detection for root schemas
- Add tests for union root schemas

**Unknown**:

- Best approach for selecting which union member to return
- How to handle ambiguous selections

### 5. No True Bridge Integration in Runtime

**What**: Template loads entire catalog, not using Bridge for incremental loading

**Why**: Missing the main benefit of Hydra - incremental asset loading

**Evidence**:

- `schema-source.ts` line 114: `Catalog.decodeSync(PROJECT_SCHEMA)` loads entire catalog
- No Bridge.peek/view usage in runtime code

**Solution**:

- Replace `Catalog.decodeSync()` with Bridge-based loading
- Implement lazy loading of schemas on demand
- Use Bridge.peek() for metadata, Bridge.view() for full schemas

**Unknown**:

- Performance impact of incremental vs. full loading
- How to handle loading errors gracefully

## Medium Priority Issues

### 5. Missing Path Disambiguation (`$$`)

**What**: Spec defines `$$` for disambiguation when hydratable appears in multiple paths

**Why**: Without this, some hydratables can't be uniquely addressed

**Solution**:

- Implement `$$` parsing in selection conversion
- Add disambiguation logic to Bridge.peek
- Create tests for multi-path scenarios

**Known**: Algorithm is specified in hydra.md spec

### 6. Incomplete Selection Type Inference

**What**: Selection type inference missing features like single-key shorthand

**Why**: Less ergonomic API for users

**Solution**:

- Implement single-key shorthand (e.g., `{ User: 'id123' }`)
- Complete type inference for all selection patterns
- Add comprehensive type tests

**Known**: Examples in research/plan.md

### 7. Test Coverage Gaps

**What**: Missing tests for complex scenarios

**Why**: Can't ensure reliability without proper test coverage

**Specific gaps**:

- Path disambiguation scenarios
- Circular reference handling
- Real Catalog/Schema integration tests
- Error cases (corrupt files, version mismatches)

**Solution**: Add comprehensive test suite

## Low Priority Issues

### 8. Unfinished TODOs

**What**: TODO comments in code indicating incomplete features

**Where**:

- `src/lib/hydra/bridge/selection/infer.test.ts`: "Enable remaining tests"
- `src/lib/hydra/$.test.ts`: "Tag namespace not yet implemented"

**Solution**: Complete or remove outdated TODOs

### 9. Error Handling Improvements

**What**: Many edge cases not handled gracefully

**Examples**:

- Corrupt JSON files
- Schema version mismatches
- Missing required files
- Invalid selections

**Solution**: Add comprehensive error handling with specific error types

## Design Improvements

### 10. Separation of Concerns

**What**: Bridge tightly coupled to file I/O

**Why**: Makes testing harder, limits flexibility

**Solution**:

- Better abstraction between Bridge and IO layer
- More use of Effect patterns for composition

### 11. Performance Optimizations

**What**: No caching strategy for frequently accessed hydratables

**Why**: Repeated disk reads for same data

**Solution**:

- Implement LRU cache for hydratables
- Add cache invalidation strategy
- Profile and optimize hot paths

### 12. Developer Experience

**What**: No HMR support for schema changes through Bridge

**Why**: Requires dev server restart for schema updates

**Solution**:

- Implement file watching for Bridge assets
- Add HMR invalidation for schema changes
- Improve error messages and debugging

### 13. ADT Annotation Inconsistency

**What**: Different ADT annotation patterns between versioned.ts and unversioned.ts

**Evidence**:

- `unversioned.ts` has explicit `adt: { name: 'Schema' }` annotation
- `versioned.ts` uses different pattern without explicit annotations

**Why**: Inconsistent patterns make ADT detection unreliable

**Solution**:

- Standardize ADT annotation approach across all union members
- Update Hydra ADT detection to handle both patterns

## Implementation Order

1. **Fix Critical Issues First** (1-2 days)
   - Resolve schema tag mismatch
   - Fix circular reference error
   - Ensure tests can run

2. **Core Functionality** (3-4 days)
   - Implement Bridge factory pattern
   - Fix Bridge.view() for unions
   - Integrate Bridge in runtime properly

3. **Feature Completion** (2-3 days)
   - Path disambiguation (`$`)
   - Selection type inference
   - Error handling

4. **Quality & Performance** (2-3 days)
   - Test coverage
   - Performance optimizations
   - Developer experience

## Total Estimated Time: 8-10 days

## Risks

- Changing schema tags may break existing persisted data
- Circular reference fix might require significant refactoring
- Performance impact of incremental loading unknown
- Complex type inference may have edge cases
- Integration changes could affect existing functionality
- Different ADT patterns might cause runtime issues

## Verification Notes

This audit was thoroughly verified by:

1. Examining actual file contents and line numbers
2. Cross-referencing implementation with tests
3. Verifying tag usage across the codebase
4. Confirming circular reference error in tests
5. Checking Bridge usage patterns in build system
