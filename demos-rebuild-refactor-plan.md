# Demos Rebuild Refactor Plan

## Problem Statement

The current `demos-rebuild-current-cycle` workflow has a fundamental flaw: it uses `buildMultipleVersions` which sequentially checks out different git tags in the same runner. This causes:

- Build tool version mismatches
- State contamination between builds
- Sequential processing (slow)
- Fragile recovery on failures

## Solution Overview

Use GitHub Actions matrix strategy to build each version in parallel on separate runners.

## Discrete Implementation Chunks

### 1. ~~**Refactor DemoBuilder from Class to Pure Functions**~~ ✅ COMPLETED

This task has been completed. The DemoBuilder class has been successfully refactored to pure functions with backward compatibility maintained.

### 2. **Create Flexible SemVer Type System** (Plumbing)

**What**: Create a flexible type system that accepts both string and parsed semver objects\
**Why**: Avoid repeated parsing, provide type safety, maintain flexibility\
**Complexity**: Medium - creates foundation for all version handling\
**Location**: Add to version-history module, with generic brand helper in kit-temp

The SemVer type system will use a union type approach:

```typescript
// src/lib/version-history/schemas.ts (new file)
import { type Brand } from '#lib/kit-temp'
import type { Version as SemVerObject } from '@vltpkg/semver'
import { parse as semverParse } from '@vltpkg/semver'
import { z } from 'zod/v4'

// Branded type for validated semver strings
export type SemVerString = Brand<string, 'SemVer'>

// Union type that accepts either form
export type SemVerInput = SemVerString | SemVerObject

// Zod schema for validation
export const SemVerSchema = z.string()
  .refine(
    (val) => semverParse(val) !== undefined,
    { message: 'Must be valid semver format' },
  )
  .transform((val) => val as SemVerString)

// Helper to normalize input to parsed object
export function normalizeSemVerInput(semVerInput: SemVerInput): SemVerObject {
  if (typeof semVerInput === 'string') {
    const parsed = semverParse(semVerInput)
    if (!parsed) throw new Error(`Invalid semver: ${semVerInput}`)
    return parsed
  }
  return semVerInput
}

// Helper to get string representation
export function getSemVerString(semVerInput: SemVerInput): string {
  if (typeof semVerInput === 'string') {
    return semVerInput
  }
  return semVerInput.format()
}

// Type guard
export function isSemVerString(value: unknown): value is SemVerString {
  return SemVerSchema.safeParse(value).success
}
```

**Key Benefits:**

1. **No Repeated Parsing**: Functions can accept already-parsed objects
2. **Type Safety**: Branded strings prevent invalid semver values
3. **Flexibility**: Accept either form based on what's available
4. **Performance**: Skip parsing when working with Version objects
5. **Consistent Naming**: Clear distinction between String/Object/Input

**Example Usage:**

```typescript
// Functions can now accept either form
export function isPrerelease(semVerInput: SemVerInput): boolean {
  const parsed = normalizeSemVerInput(semVerInput)
  return parsed.prerelease !== undefined && parsed.prerelease.length > 0
}

// Can pass version.semver directly (already parsed)
const version: Version = await getVersion()
if (isPrerelease(version.semver)) { /* ... */ }

// Or pass a string
if (isPrerelease('1.2.3-beta.1')) { /* ... */ }
```

### 3. **Matrix Workflow Job Architecture** (Core Change)

**What**: Split the current single-job workflow into three matrix jobs\
**Why**: Enable parallel builds, fix the git checkout issue\
**Complexity**: Medium - changes workflow architecture

```yaml
jobs:
  determine-versions:
    outputs:
      versions: ${{ steps.get-versions.outputs.versions }}
      stable-version: ${{ steps.get-versions.outputs.stable }}
      has-versions: ${{ steps.get-versions.outputs.has-versions }}
      
  build-version:
    needs: determine-versions
    strategy:
      matrix:
        version: ${{ fromJSON(needs.determine-versions.outputs.versions) }}
        
  deploy:
    needs: [determine-versions, build-version]
```

### 4. **Version List Generator Step** (Plumbing)

**What**: Extract logic to determine which versions to build\
**Why**: Reusable across workflows, testable\
**Complexity**: Low - extract existing logic

```typescript
// src/lib/demos/version-selector.ts (new file)
import { VersionHistory } from '#lib/version-history/index'
import { type DemoConfig, meetsMinimumPolenVersion } from './config.ts'

export async function getVersionsToBuild(config: DemoConfig): Promise<{
  versions: string[]
  stable?: string
}> {
  const cycle = await VersionHistory.getCurrentDevelopmentCycle()

  if (!cycle.stable) {
    return { versions: [], stable: undefined }
  }

  const versions = cycle.all
    .filter(v => meetsMinimumPolenVersion(config, v.git.tag))
    .map(v => v.git.tag)

  return {
    versions,
    stable: cycle.stable.git.tag,
  }
}
```

### 5. **Artifact Consolidator Utility** (Plumbing)

**What**: Generic utility to consolidate build artifacts\
**Why**: Hide complexity of artifact handling\
**Complexity**: Low - generic utility

```typescript
// src/lib/github-actions/artifact-utils.ts (new file)
import { promises as fs } from 'node:fs'
import * as path from 'node:path'

export async function consolidateArtifacts(options: {
  artifactDir: string
  outputDir: string
  artifactPrefix: string
  transformer?: (artifactName: string) => string
}): Promise<string[]> {
  const { artifactDir, outputDir, artifactPrefix, transformer } = options
  const processed: string[] = []

  const entries = await fs.readdir(artifactDir)

  for (const entry of entries) {
    if (entry.startsWith(artifactPrefix)) {
      const name = transformer
        ? transformer(entry)
        : entry.replace(artifactPrefix, '')
      const sourcePath = path.join(artifactDir, entry)
      const targetPath = path.join(outputDir, name)

      await fs.cp(sourcePath, targetPath, { recursive: true })
      processed.push(name)
    }
  }

  return processed
}
```

### 6. **Remove buildMultipleVersions Method** (Cleanup)

**What**: Delete the problematic sequential build method\
**Why**: It's the root cause of the issue\
**Complexity**: Low - just deletion\
**When**: After new workflow is tested and working

### 7. **Update Deployment Steps** (Integration)

**What**: Update the three workflow steps to use new patterns\
**Why**: Wire everything together\
**Complexity**: Medium - integrate all pieces

Three new step files:

- `get-versions-to-build.ts` - Uses version-selector utility
- `build-single-version.ts` - Uses refactored DemoBuilder
- `consolidate-demos.ts` - Uses artifact-utils

## Implementation Order

### Phase 1: Plumbing (No Breaking Changes)

#### ~~Step 1: Add Generic Brand Type Helper~~ ✅ COMPLETED

- Added `Brand<$BaseType, $BrandName>` type to `kit-temp.ts`
- Added `brand()` helper function with comprehensive JSDoc
- Used $ prefix convention for type parameters
- Fixed TypeScript implementation to use `__brand` field instead of unique symbol

#### Step 2: Create SemVer Type System

- Create `version-history/schemas.ts`
- Define `SemVerString` branded type, `SemVerObject` type alias, and `SemVerInput` union
- Add `SemVerSchema` for validation
- Add `normalizeSemVerInput()` and `getSemVerString()` helpers
- Export from version-history index

#### Step 3: Refactor version-history to use SemVerInput

- Update function signatures to accept `SemVerInput` instead of just strings
- Use consistent parameter naming (`semVerInput`)
- Add function overloads for backward compatibility where needed
- This eliminates repeated parsing and improves performance

#### Step 4: Add Version Selector Utility

- Create `version-selector.ts`
- Extract logic from existing code
- Use the new `SemVerInput` types
- Return results using the flexible type system

#### Step 5: Add Artifact Consolidator Utility

- Create `artifact-utils.ts` in github-actions lib
- Generic utility for handling build artifacts
- No dependencies on other steps

### Phase 2: Refactoring (Backward Compatible)

4. ~~Refactor DemoBuilder to functions (#1)~~ ✅ COMPLETED
   - Kept old class export for compatibility
   - Updated all internal usages

### Phase 3: Workflow Update (The Fix)

5. Create new workflow steps (#7)
6. Update workflow to use matrix strategy (#3)
7. Test thoroughly with a few versions

### Phase 4: Cleanup

8. Remove old buildMultipleVersions method (#6)
9. Remove compatibility exports if safe

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
