# Demos Rebuild Refactor Plan

## Problem Statement

The current `demos-rebuild-current-cycle` workflow has a fundamental flaw: it uses `buildMultipleVersions` which sequentially checks out different git tags in the same runner. This causes:

- Build tool version mismatches
- State contamination between builds
- Sequential processing (slow)
- Fragile recovery on failures

## Solution Overview

Use GitHub Actions matrix strategy to build each version in parallel on separate runners.

## Implementation Status

### ✅ Completed

1. **GitHub Actions Step System Refactor**
   - Removed single step support - only collections now
   - Merged Step and StepDefinition interfaces
   - Simplified runner to remove excess warnings
   - Moved schemas/context.ts to runner-args-context.ts
   - All steps now have guaranteed names
   - Clean architecture with single source of truth in step.ts

2. **Type System Improvements**
   - StepInput type for user authoring (function or object with optional name)
   - Step interface with required name for runtime
   - Automatic name injection from collection keys
   - Input transformation proxy for kebab-case to camelCase access

3. **Version List Generator** ✅
   - Created `getBuildableVersions()` utility in get-buildable-versions.ts
   - Returns versions array, stable version, and hasVersions flag
   - Filters versions based on minimum Polen version requirements

### ✅ Completed (Phase 3)

4. **Matrix Workflow Architecture**
   - Split workflow into three jobs: determine-versions, build-version (matrix), deploy
   - Each version builds in parallel on separate runners
   - Artifacts uploaded and consolidated in deploy job
   - Implemented in demos-rebuild-current-cycle.yaml

5. **Workflow Steps Implementation**
   - Created three steps in demos-rebuild-current-cycle.steps.ts:
     - `get-versions`: Uses getBuildableVersions() to determine what to build
     - `build-version`: Builds single version from matrix
     - `deploy`: Consolidates artifacts and deploys to GitHub Pages
   - All steps use simplified approach without explicit schemas

6. **Output Type Inference Feature**
   - Enhanced step system to support output type inference
   - Runner now exports outputs even without explicit schema
   - Enables cleaner step definitions with less boilerplate
   - Type safety maintained through TypeScript inference

### 📋 TODO

7. **Testing & Verification**
   - Test the new matrix workflow with a few versions
   - Verify parallel execution in GitHub Actions UI
   - Check that deployed demos work correctly
   - Test failure scenarios (one version fails to build)

8. **Cleanup** (After verification)
   - Remove `buildMultipleVersions` method from builder.ts
   - Remove any other sequential build logic
   - Update documentation to reflect new architecture

## Implementation Summary

### Phase 1: Foundation ✅

- GitHub Actions step system refactor
- Type system improvements
- Clean architecture with collections-only approach

### Phase 2: Utilities ✅

- Version list generator (getBuildableVersions)
- Output type inference feature

### Phase 3: Matrix Implementation ✅

- Updated workflow YAML to use matrix strategy
- Created three workflow steps (get-versions, build-version, deploy)
- Implemented artifact consolidation in deploy step

### Phase 4: Testing & Cleanup (Pending)

- Verify the new workflow in GitHub Actions
- Remove buildMultipleVersions after verification

## Key Design Decisions

### Base Path Handling

- Build with correct base paths from the start: `/${version}/`
- No repo name in base path (GitHub Pages adds it automatically)
- Only use Polen rebase for dist-tags that need path updates

### SemVer Type System Design

**Why SemVerInput Union Type:**

The `SemVerInput` union type (`SemVerString | SemVerObject`) solves several problems:

1. **Avoids Repeated Parsing**: When you have a `Version` object with `semver` already parsed, you can pass it directly
2. **Type Safety**: Branded `SemVerString` ensures only validated strings are used
3. **Performance**: Skip parsing when the object form is available
4. **Flexibility**: Functions work with whatever form you have
5. **Gradual Migration**: Can update functions incrementally

**Naming Consistency:**

- `SemVerString` - Branded string type for validated semver
- `SemVerObject` - Type alias for parsed semver from @vltpkg/semver
- `SemVerInput` - Union accepting either form
- `semVerInput` - Parameter name for functions accepting the union
- `normalizeSemVerInput()` - Converts any input to parsed object
- `getSemVerString()` - Gets string representation from any input

**Usage Example:**

```typescript
// Version already has parsed semver
const version = await getVersion()
isPrerelease(version.semver) // No parsing needed!

// String from user input
const input = '1.2.3-beta'
isPrerelease(input) // Parsed internally

// Both work seamlessly
```

### Type Safety

- Use proper semver validation schema
- Strong typing for all step inputs/outputs
- Reuse existing types from version-history module

### Error Handling

- Matrix builds with `fail-fast: false` so one failure doesn't stop all
- Proper artifact retention (1 day for temporary builds)
- Clear error messages when versions can't be built

## Testing Strategy

1. Create a test branch with minimal versions
2. Run the new workflow on that branch
3. Verify parallel execution in GitHub Actions UI
4. Check deployed demos work correctly
5. Test failure scenarios (one version fails to build)

## Migration Notes

- The refactored code can coexist with the old code
- We can test the new workflow alongside the old one
- Once verified, we can remove the old implementation
- No changes needed to PR workflows or release workflows

## Recent Architecture Changes

### GitHub Actions Step System

- **Single file architecture**: All step types now in `step.ts`
- **Collections only**: No more single step support
- **Guaranteed names**: All steps have names from collection keys or explicit override
- **Clean imports**: No more circular dependencies
- **Simplified runner**: Removed excess property warnings and test scenarios

### Benefits of New Architecture

1. **Simplicity**: One way to define steps (collections)
2. **Type Safety**: All steps have names, clear input/output types
3. **Clean API**: Intuitive access to step outputs via inputs
4. **No Magic**: Explicit data flow in workflow YAML
5. **Maintainability**: Single source of truth, no duplication
