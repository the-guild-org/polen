# Base Path Support for Subdirectory Deployments

## Summary

Polen now has full support for base path configuration, which allows deploying to subdirectories like GitHub Pages project sites (`/my-project/`) or PR previews (`/pr-123/`).

## Current Status

### ✅ Fully Working

- Base path configuration option in `polen.config.ts`:
  ```typescript
  export default Polen.defineConfig({
    build: {
      base: '/my-subdirectory/',
    },
  })
  ```
- Asset paths (CSS, JS) are correctly prefixed with base path
- Favicon paths are correctly prefixed with base path
- Vite is configured with the base path
- React Router is configured with basename for client-side routing
- SSG (Static Site Generation) works correctly with base path
- Internal navigation links are prefixed with base path
- Server static asset handling respects base path
- Development server works with base path

## Implementation Details

### Files Modified/Created

- `src/api/config/configurator.ts` - Added base path configuration option
- `src/api/config-resolver/vite.ts` - Pass base path to Vite config
- `src/api/utils/asset-url/` - New helper functions for URL generation
- `src/project-data.ts` - Added basePath to ProjectData interface
- `src/api/vite/plugins/core.ts` - Include basePath in project data and static route
- `src/template/routes/root.tsx` - Use base path for favicon URLs
- `src/template/server/manifest.ts` - Use base path for asset URLs
- `src/template/server/render-page.tsx` - Pass base path to manifest injection
- `src/template/entry.client.tsx` - Configure React Router with basename
- `src/template/server/view.ts` - Configure server-side React Router with basename
- `src/template/server/ssg/generate.ts` - Fixed SSG to prepend base path to requests

### Tests

- Unit tests: `src/api/utils/asset-url/asset-url.test.ts` - Tests for URL helper functions
- Integration tests: `tests/integration/cases/base-path.test.ts` - End-to-end tests for base path feature

## Usage Examples

### GitHub Pages Project Site

```typescript
export default Polen.defineConfig({
  build: {
    base: '/my-repo-name/',
  },
})
```

### PR Preview Deployments

```typescript
export default Polen.defineConfig({
  build: {
    base: '/pr-123/',
  },
})
```

### Nested Documentation

```typescript
export default Polen.defineConfig({
  build: {
    base: '/docs/api/v2/',
  },
})
```

## Related Issues

- GitHub Pages subdirectory deployment (#89)
- Base path configuration support (#91) - Resolved by this implementation
