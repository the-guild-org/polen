# Deployment

Polen generates static sites that can be deployed to any static hosting service.

## Deployment Options

### Static Hosting Services

Polen's SSG (Static Site Generation) builds work with:

- [GitHub Pages](./github-pages.md) - Free hosting for GitHub repositories
- Vercel - Automatic deployments with preview URLs
- Netlify - Simple drag-and-drop or Git-based deployments
- Cloudflare Pages - Fast global CDN with analytics
- AWS S3 + CloudFront - Scalable enterprise hosting
- Any web server - Nginx, Apache, etc.

### Build Architecture

Polen supports three build architectures:

1. **SSG (Static Site Generation)** - Pre-renders all pages at build time
   - Best for documentation sites
   - No server required
   - Fast page loads
   - SEO friendly

2. **SSR (Server-Side Rendering)** - Renders pages on each request
   - Dynamic content
   - Requires Node.js server
   - Real-time data

3. **SPA (Single Page Application)** - Client-side rendering
   - Interactive applications
   - Initial load includes all assets
   - Good for internal tools

For most deployments, SSG is recommended:

```bash
pnpm build --architecture ssg
```

## Base Path Configuration

When deploying to a subdirectory (common with GitHub Pages, corporate domains), configure the base path:

```bash
# Deploy to example.com/docs/
pnpm build --base /docs/

# Deploy to example.com/v2/api/
pnpm build --base /v2/api/
```

## Post-Build Path Updates

Use Polen's rebase feature to update paths after building:

```bash
# Update base path without rebuilding
npx polen static rebase ./build --new-base-path /new/path/

# Create a copy with new paths
npx polen static rebase ./build --new-base-path /staging/ --mode copy --target ./build-staging
```

This is useful for:

- Deploying to multiple environments
- PR preview deployments
- A/B testing different paths
- Emergency path changes

## Deployment Checklist

Before deploying:

- [ ] Build with the correct architecture (`ssg` for static hosting)
- [ ] Set the correct base path for your deployment URL
- [ ] Test the build locally with a static server
- [ ] Verify all assets load correctly
- [ ] Check that navigation works with the base path
- [ ] Ensure any API endpoints are configured

## Next Steps

- [Deploy to GitHub Pages](./github-pages.md)
- [Configure CI/CD pipelines](../guide/ci-cd.md)
- [Optimize build performance](../guide/performance.md)
