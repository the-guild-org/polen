# Base Path Support for Subdirectory Deployments

## Summary

Polen now has partial support for base path configuration, which allows deploying to subdirectories like GitHub Pages project sites (`/my-project/`) or PR previews (`/pr-123/`).

## Current Status

### ✅ Working
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

### ❌ Not Working / Limitations
1. **SSG (Static Site Generation) fails with base path**
   - SSG generates routes without base path prefix
   - React Router expects routes with base path prefix
   - This causes 404 errors during SSG build
   - **Current workaround**: Use SSR mode for subdirectory deployments

2. **Internal navigation links in SSG mode**
   - Links are not prefixed with base path in statically generated HTML
   - Client-side navigation works after hydration

3. **Server static asset handling**
   - Development server may not serve assets correctly with base path

## Implementation Details

### Files Modified
- `src/api/config/configurator.ts` - Added base path configuration option
- `src/api/config-resolver/vite.ts` - Pass base path to Vite config
- `src/lib/asset-url/` - New helper functions for URL generation
- `src/project-data.ts` - Added basePath to ProjectData interface
- `src/api/vite/plugins/core.ts` - Include basePath in project data
- `src/template/routes/root.tsx` - Use base path for favicon URLs
- `src/template/server/manifest.ts` - Use base path for asset URLs
- `src/template/server/render-page.tsx` - Pass base path to manifest injection
- `src/template/entry.client.tsx` - Configure React Router with basename
- `src/template/server/view.ts` - Configure server-side React Router with basename

### Test Script
A test script is available at `scripts/test-base-path.mjs` to verify base path functionality.

## Next Steps

1. **Fix SSG with base path**
   - Update SSG generation to prefix all routes with base path
   - Ensure React Router static handler works with base path
   - Update link generation in static HTML

2. **Update documentation**
   - Add base path configuration to user documentation
   - Document SSR vs SSG limitations with base path

3. **Add integration tests**
   - Test base path with different values
   - Test both SSR and SSG modes
   - Test navigation and asset loading

## Workaround for GitHub Pages

Until SSG is fixed, use SSR mode for subdirectory deployments:

1. Deploy with SSR (default mode)
2. Or use a separate repository/domain for each deployment
3. Or deploy to root path only

## Related Issues
- GitHub Pages subdirectory deployment (#89)
- PR preview deployments need base path support