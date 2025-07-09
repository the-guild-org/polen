# Vite Plugin Improvements Analysis

## 1. `polen:internal-import-alias` Plugin

### Current State

- Handles `#` imports from Polen's own source code
- Only activates when importer is from Polen framework itself
- Manually resolves paths by string manipulation
- Has special case for `index.html` imports

### Analysis

#### Can it be factored out into a lib?

The plugin might be **completely removable** instead of being factored out.

#### Does it need environment awareness?

No, it already works across all environments correctly.

#### The 'index.html' part seems not needed now?

Correct, can be removed - RSC doesn't use index.html.

#### Is it duplicating Node.js subpath imports?

Yes! Since Vite 4.2+ supports package.json imports field natively.

### Key Findings

- **Vite natively supports package subpath imports** since v4.2.0
- Polen now uses tsx for executing TypeScript files
- The package.json already defines all `#` imports correctly
- There's a separate `VitePluginSelfContainedMode` for development use cases

### Recommendation: Remove the plugin entirely

The `polen:internal-import-alias` plugin appears to be legacy code from before:

- Vite had native subpath imports support
- Polen switched to using tsx for TypeScript execution
- The build process was standardized

## 2. `VitePluginReactiveData` Improvements

### Current Implementation

- Creates virtual modules that export reactive data
- Uses Vue's reactivity system to track changes
- Invalidates modules when data changes
- Returns raw stringified data in the `load` hook
- Has a TODO comment about using Vite's builtin JSON plugin

### Identified Areas for Improvement

#### 1. Integration with VitePluginJson

Currently, the plugin returns raw stringified data but doesn't leverage the existing `VitePluginJson` for proper module generation.

**Improvement**: Instead of returning raw stringified data, delegate to `VitePluginJson` for proper module generation with codec support.

#### 2. Simplify Environment Tracking

The plugin tracks environment names in a Set to handle invalidation. This could be simplified.

**Improvement**: Consider using Vite's built-in module graph APIs more efficiently.

#### 3. Better Type Safety

The plugin accepts `object | unknown[]` which is very broad.

**Improvement**: Use generics to provide better type safety for the data being passed.

#### 4. Optimize Invalidation

Currently schedules invalidation on every effect trigger, even if data hasn't actually changed.

**Improvement**: Add comparison logic to only invalidate when data has meaningfully changed.

#### 5. Remove Manual Codec Handling

Since `VitePluginJson` already handles codec transformation, the reactive data plugin shouldn't need to stringify data itself.

**Improvement**: Return data in a format that VitePluginJson can process, avoiding duplication of codec logic.

### Proposed Refactoring

1. **Make it a higher-order plugin** that wraps VitePluginJson
2. **Use Vite's transform pipeline** instead of manually handling codecs
3. **Leverage Vite's built-in JSON handling** where possible
4. **Add proper TypeScript generics** for better type inference
5. **Implement smart invalidation** with data comparison

### Main Insight

This plugin is doing too much - it's both handling reactivity AND JSON transformation. By separating these concerns and leveraging existing Vite capabilities, the plugin can be significantly simplified.

## Summary

Both plugins show signs of technical debt:

- `polen:internal-import-alias` can likely be removed entirely
- `VitePluginReactiveData` needs refactoring to separate concerns and leverage existing infrastructure

These improvements would simplify the codebase and reduce maintenance burden while maintaining all functionality.
