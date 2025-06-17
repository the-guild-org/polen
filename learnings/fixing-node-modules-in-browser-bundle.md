# Fixing Node.js Modules in Browser Bundles: A Case Study with Polen and @wollybeard/kit

## Problem Summary

When importing `@wollybeard/kit` in Polen's browser environment, we encountered warnings about Node.js modules (particularly `node:tty`) being included in the browser bundle.

## Root Cause Analysis

### 1. The Original Problem: No Platform-Specific Code

Initially, Kit had no platform-specific imports at all. It was a regular library that directly imported Node.js modules:

```typescript
// Original Kit code - no platform awareness
import consola from 'consola' // Which imports node:tty
import { readFile } from 'node:fs/promises'
import { inspect } from 'node:util'
```

This caused immediate problems when Kit was used in browser environments.

### 2. First Attempt: Browser/Node Conditional Exports

We tried adding conditional exports with `.browser.ts` files:

```json
{
  "browser": "./build/*.browser.js",
  "default": "./build/*.js"
}
```

However, this didn't work because:

- **Vite dev mode does NOT tree-shake** - it pre-bundles dependencies for performance
- During pre-bundling, Vite was selecting the "default" export which still contained Node.js modules
- The browser conditions weren't being properly resolved

### 3. The Debug Module Challenge

Kit's debug module was particularly problematic:

```typescript
// debug/debug.ts
import consola from 'consola'
export * from 'consola' // All of consola's exports
export const debug = createDebug('kit')
```

Consola imports Node.js modules like `node:tty` for terminal color support. Even with browser conditionals, the wrong platform code was being selected during Vite's pre-bundling.

## Solution: Platform-Specific Imports

### 1. Conditional Package Imports

We implemented platform-specific builds using Node.js conditional exports:

```json
// package.json
{
  "imports": {
    "#platform:*.js": {
      "browser": "./build/*.browser.js",
      "default": "./build/*.node.js"
    }
  }
}
```

### 2. Platform-Specific Implementations

Created separate implementations for browser and Node.js:

```typescript
// fs/fs.browser.ts
export const stat = () => {
  throw new Error('stat not available in browser')
}
export const readFile = () => {
  throw new Error('readFile not available in browser')
}

// fs/fs.node.ts
export * from 'node:fs/promises'
```

### 3. Import Path Corrections

Fixed incorrect import paths that were preventing proper module resolution:

```typescript
// Before (incorrect)
import * as PathDriver from '#platform:path/driver.ts'

// After (correct)
import * as PlatformPath from '#platform:path/path.ts'
```

## Key Learnings

### 1. Understand Vite's Dev Mode Behavior

- Vite dev mode doesn't tree-shake - it pre-bundles for performance
- During pre-bundling, Vite must select one conditional export path
- The "default" export was being used, bringing in Node.js modules

### 2. Platform-Specific Code Requires Careful Architecture

- Use conditional exports for platform-specific implementations
- Ensure import paths match the export configuration exactly
- Test in both environments to catch resolution issues early

### 3. Debug/Development Code Needs Special Handling

- Debug utilities often import Node.js modules for enhanced features
- Consider lazy loading or dynamic imports for debug code
- Provide browser-safe alternatives or stubs

### 4. Bundle Analysis is Critical

- Use Vite's dependency pre-bundling logs to identify issues
- Check browser console for module warnings
- Verify tree-shaking effectiveness with bundle analyzers

## Future Considerations

### Vite with Rolldown: Future Dev Mode Tree-shaking

Vite with Rolldown will eventually support tree-shaking in dev mode, which would theoretically allow looser module boundaries in Kit. However, making Kit truly isomorphic provides long-term value beyond just fixing this specific issue:

1. **Framework Independence**: Isomorphic code works with any bundler, not just Vite
2. **Better Developer Experience**: Clear platform boundaries make the library more predictable
3. **Performance**: Browser-specific implementations can be optimized without Node.js overhead
4. **Edge Computing**: Isomorphic libraries work in edge runtimes that have limited Node.js compatibility

The `#platform:` pattern we implemented isn't just a workaround - it's a sustainable architecture pattern that improves Kit's versatility and maintainability.

## Testing Strategy

1. **Minimal Reproduction**: Create a simple Vite project to isolate the issue
2. **Incremental Testing**: Test each change in isolation
3. **Multi-Environment Validation**: Verify fixes work in both Node.js and browser contexts

## Implementation Checklist

When fixing similar issues:

- [ ] Identify modules causing warnings in browser console
- [ ] Trace import chains to find where Node.js modules are imported
- [ ] Check for `export *` statements that might force evaluation
- [ ] Implement platform-specific builds if needed
- [ ] Verify import paths match package.json exports configuration
- [ ] Test in both development and production builds
- [ ] Confirm tree-shaking removes unused code

## References

- [Vite Dependency Pre-Bundling](https://vite.dev/guide/dep-pre-bundling.html)
- [Node.js Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports)
- [Vite Rolldown](https://rolldown.rs/)
