# Virtual Module JSON Optimization Investigation

## Current Issue

The Polen framework uses virtual modules with `.json` extensions (e.g., `virtual:polen/project/data.json`) but returns JavaScript module syntax instead of pure JSON. This prevents leveraging Vite's built-in JSON optimization features.

## Background

### Vite's JSON Named Exports Feature

Vite (including rolldown-vite) has a built-in feature called `json.namedExports` that automatically transforms JSON imports into ES modules with individual exports for better tree-shaking:

```javascript
// data.json
{
  "name": "Pokemon API",
  "version": "1.0.0",
  "features": ["graphql", "changelog"]
}

// With namedExports (Vite optimization):
import { name, version } from './data.json'
// Only 'name' and 'version' are included in the bundle!
```

### Configuration

In Vite 6 (and rolldown-vite):

- `json.namedExports` is **enabled by default**
- `json.stringify` defaults to `'auto'` (only serializes large JSON files)
- Even with `json.stringify: true`, `json.namedExports` remains enabled (change from Vite 5)

```javascript
export default {
  json: {
    namedExports: true, // Default in Vite 6
    stringify: 'auto', // New in Vite 6
  },
}
```

## Current Implementation

### Virtual Module Setup

In `src/vite/plugins/core.ts`:

```typescript
export const viProjectData = polenVirtual([`project`, `data.json`], {
  allowPluginProcessing: true,
})
export const viProjectSchema = polenVirtual([`project`, `schema.json`], {
  allowPluginProcessing: true,
})
```

The `allowPluginProcessing: true` flag suggests these modules should be processed by Vite's plugins, including the JSON plugin.

### Current Loader Implementation

The loaders currently return JavaScript module syntax:

```typescript
// viProjectData loader
return `export default ${JSON.stringify(projectData)}`

// viProjectSchema loader
return `export default ${JSON.stringify(dehydrated)}`
```

## The Problem

1. **Module ID ends with `.json`** - Vite expects JSON content
2. **Loader returns JavaScript** - Creates a mismatch
3. **JSON plugin can't optimize** - Named exports aren't generated
4. **Tree-shaking is suboptimal** - Entire JSON object is bundled even if only parts are used

## Potential Solutions

### Option 1: Return Pure JSON

Change loaders to return pure JSON and let Vite's JSON plugin handle transformation:

```typescript
// Instead of:
return `export default ${JSON.stringify(projectData)}`

// Return:
return JSON.stringify(projectData)
```

**Challenges:**

- Virtual modules might need special handling for JSON plugin to work
- Current error suggests JSON plugin isn't processing virtual modules properly

### Option 2: Remove .json Extension

Change virtual module IDs to not use `.json`:

```typescript
export const viProjectData = polenVirtual([`project`, `data`], {
  allowPluginProcessing: true,
})
```

**Benefits:**

- Clearer that these are JavaScript modules
- No confusion with JSON plugin

**Drawbacks:**

- Breaking change for imports
- Type definitions need updating

### Option 3: Implement Named Exports Manually

Generate named exports in the loader:

```typescript
const data = projectData
return `
  export default ${JSON.stringify(data)};
  export const basePath = ${JSON.stringify(data.basePath)};
  export const paths = ${JSON.stringify(data.paths)};
  export const navbar = ${JSON.stringify(data.navbar)};
  export const server = ${JSON.stringify(data.server)};
  export const warnings = ${JSON.stringify(data.warnings)};
`
```

**Benefits:**

- Immediate tree-shaking benefits
- Works with current setup

**Drawbacks:**

- Manual maintenance of exports
- Doesn't leverage Vite's automatic optimization

## Investigation Steps

1. **Test if JSON plugin processes virtual modules**
   - Create a minimal test case with virtual JSON module
   - Check if `allowPluginProcessing` actually enables JSON plugin

2. **Examine Vite's JSON plugin source**
   - Understand how it identifies JSON modules
   - Check if virtual modules are handled differently

3. **Profile bundle sizes**
   - Compare current approach vs manual named exports
   - Measure actual tree-shaking impact

4. **Check rolldown-vite specifics**
   - Verify JSON handling is same as standard Vite
   - Look for any rolldown-specific optimizations

## References

- [Vite JSON Features](https://vite.dev/guide/features#json)
- [Vite 6 Release Notes](https://medium.com/@onix_react/release-vite-6-0-fe039e69e0ad)
- [Rolldown-Vite Announcement](https://voidzero.dev/posts/announcing-rolldown-vite)

## Next Steps

1. Create a spike to test pure JSON return with virtual modules
2. Benchmark tree-shaking effectiveness with different approaches
3. Consider long-term migration path if breaking changes needed
