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

### 2. **Create Reusable Semver Schema with Branded Type** (Plumbing)

**What**: Extract a reusable Zod schema for semver validation with branded types\
**Why**: Stronger typing across all workflows, eliminate duplicate validation logic, prevent invalid strings\
**Complexity**: Low - pure utility that can also refactor version-history itself\
**Location**: Add to existing version-history module, with generic brand helper in kit-temp\
**Additional Benefit**: Can refactor version-history to use this schema internally

First, add generic brand helper to kit-temp:

````typescript
// src/lib/kit-temp.ts (add to existing file)

/**
 * Create a branded type using a unique symbol
 *
 * @example
 * ```ts
 * type UserId = Brand<string, 'UserId'>
 * type Email = Brand<string, 'Email'>
 *
 * const userId: UserId = 'abc' as UserId
 * const email: Email = 'test@example.com' as Email
 *
 * // Type error: can't assign different brands
 * const id: UserId = email // Error!
 * ```
 */
export type Brand<T, B extends string> =
  & T
  & { readonly [brandKey in `__brand_${B}`]: unique symbol }

/**
 * Helper to create a branded value (with runtime validation)
 */
export const brand = <T, B extends string>(value: T): Brand<T, B> => {
  return value as Brand<T, B>
}
````

Then create the semver schema with branded type:

```typescript
// src/lib/version-history/schemas.ts (new file)
import { type Brand } from '#lib/kit-temp'
import { parse as semverParse } from '@vltpkg/semver'
import { z } from 'zod/v4'

// Branded type for validated semver strings
export type SemVerString = Brand<string, 'SemVer'>

export const SemVerSchema = z.string()
  .refine(
    (val) => semverParse(val) !== undefined,
    { message: 'Must be valid semver format' },
  )
  .transform((val) => val as SemVerString)

// Helper to create SemVerString from validated input
export function semVerString(value: string): SemVerString {
  return SemVerSchema.parse(value)
}

// Type guard
export function isSemVerString(value: unknown): value is SemVerString {
  return SemVerSchema.safeParse(value).success
}

// Export from index
// src/lib/version-history/index.ts
export * from './schemas.ts'
```

**Benefits of branded types:**

1. Can't accidentally pass any string where a semver is expected
2. Type-safe at compile time, zero runtime overhead
3. Clean autocomplete (no visible brand properties)
4. Gradual migration possible with overloads

**Refactoring opportunity**: Update version-history functions to accept/return `SemVerString`:

```typescript
// Before
export function isStableVersion(tag: string): boolean

// After (with overload for migration)
export function isStableVersion(tag: SemVerString): boolean
export function isStableVersion(tag: string): boolean // deprecated overload
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

1. Add brand helper to kit-temp
   - Generic `Brand<T, B>` type and `brand()` helper
   - Can be reused for other branded types in the future
2. Add semver schema with branded type (#2)
   - Create `version-history/schemas.ts` with `SemVerString` branded type
   - Export from version-history index
   - Optionally refactor version-history to use the schema internally
3. Add version selector utility (#4)
4. Add artifact consolidator utility (#5)

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

### Semver Validation: @vltpkg/semver vs Zod Schema

**What @vltpkg/semver provides:**

- Full semver parsing: `parse()` returns a structured object with major, minor, patch, prerelease, etc.
- Comparison functions: `compare()`, `gt()`, `lt()`, etc.
- Manipulation functions: `inc()`, `diff()`, etc.
- Validation: `parse()` returns undefined for invalid semver

**What our Zod SemVerSchema adds:**

- Runtime type validation with TypeScript integration
- Composability with other Zod schemas
- Better error messages for validation failures
- Integration with form validation, API validation, etc.
- Can be used in places where we just need validation, not parsing

**The overlap:**

- Both validate semver strings
- Our schema uses @vltpkg/semver's `parse()` internally for validation

**When to use which:**

- Use `@vltpkg/semver` when you need to parse, compare, or manipulate versions
- Use `SemVerSchema` when you need runtime validation in Zod contexts (API inputs, config files, etc.)
- They complement each other - the schema ensures valid input before using @vltpkg/semver functions

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
