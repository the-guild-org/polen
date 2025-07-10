# Service GitHub Pages

Polen supports deployment to GitHub Pages with static site generation (SSG) builds.

## Quick Start

1. **Enable GitHub Pages** in your repository:
   - Go to Settings → Pages
   - Under "Source", select "GitHub Actions"

2. **Create a deployment workflow** in `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Build site
        run: npx polen build --architecture ssg --base /<repository-name>/

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

3. **Update the base path** in the workflow to match your repository name

4. **Push to main** - the deployment will run automatically

## Configuration

### Base Path

When deploying to GitHub Pages, you need to configure the base path:

#### Via CLI

```bash
npx polen build --architecture ssg --base /your-repo-name/
```

#### Via Config File

```typescript
// polen.config.ts
export default defineConfig({
  build: {
    base: '/your-repo-name/',
  },
})
```

### Build Architecture

GitHub Pages requires static files, so use the `ssg` (Static Site Generation) architecture:

```bash
npx polen build --architecture ssg
```

## Advanced Features

### Multiple Environments

Use Polen's rebase feature to deploy the same build to different paths:

```bash
# Build once
npx polen build --architecture ssg

# Deploy to staging
npx polen static rebase ./build --new-base-path /staging/ --mode copy --target ./build-staging

# Deploy to production
npx polen static rebase ./build --new-base-path /production/ --mode copy --target ./build-prod
```

### PR Preview Deployments

For pull request previews, you can use the base path with PR numbers:

```yaml
- name: Build PR preview
  run: npx polen build --architecture ssg --base /pr-${{ github.event.number }}/
```

### Custom Domain

To use a custom domain:

1. Create a `CNAME` file in your build output:
   ```yaml
   - name: Add CNAME
     run: echo "docs.example.com" > ./build/CNAME
   ```

2. Configure your domain's DNS to point to GitHub Pages

## Troubleshooting

### Build Output Directory

Polen's SSG builds output to the `build/` directory by default. Make sure your workflow uploads from the correct path:

```yaml
- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: ./build  # Not ./dist
```

### Base Path Issues

- Base paths must start and end with `/`
- Use the same base path in your build command and GitHub Pages settings
- For root deployments, use `/` as the base path

### 404 Errors

If you get 404 errors:

1. Check that GitHub Pages is enabled in repository settings
2. Verify the base path matches your deployment URL
3. Ensure the workflow completed successfully
4. Check that all assets use relative paths

## Example Projects

See the [Polen deployment workflow](https://github.com/the-guild-org/polen/blob/main/.github/workflows/deploy.yml) for a complete working example.
