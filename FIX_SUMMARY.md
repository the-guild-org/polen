# Import Issue Fix Summary

## Problem
The CI build was failing with TypeScript error TS6059: Files from `.github` directory were not under `rootDir` `/src`.

The issue was caused by:
1. `scripts/build-demos-home.ts` importing from `.github/lib/demos/ui/landing-page.ts`
2. `src/lib/demos/builder.ts` importing from `scripts/build-demos-home.ts`
3. This created a chain where `src` indirectly imported from `.github`, violating TypeScript's `rootDir` constraint

## Solution
Moved the UI components from `.github/lib/demos/ui/` to `src/lib/demos/ui/`:

### Files Moved
- `.github/lib/demos/ui/landing-page.ts` → `src/lib/demos/ui/landing-page.ts`
- `.github/lib/demos/ui/page-renderer.ts` → `src/lib/demos/ui/page-renderer.ts`
- `.github/lib/demos/ui/components.ts` → `src/lib/demos/ui/components.ts`
- `.github/lib/demos/ui/data-collector.ts` → `src/lib/demos/ui/data-collector.ts`

### Import Updates
1. Updated imports in moved UI files to use relative paths
2. Updated `scripts/build-demos-home.ts` to import from new location
3. Updated `src/lib/demos/builder.ts` to import directly from `./ui/landing-page.js`
4. Updated `.github/lib/demos/orchestrator.ts` to import from `src/lib/demos`
5. Exported UI components from `src/lib/demos/index.ts`
6. Removed UI exports from `.github/lib/demos/index.ts`

## Result
- TypeScript build now passes
- Clear separation maintained: `.github` can import from `src`, but not vice versa
- UI components are now properly located in the source directory where they can be imported by other source files