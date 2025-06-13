# GitHub Pages Deployment Workflow Design

## Executive Summary

This document outlines the design for a GitHub Actions workflow that deploys Polen example projects (specifically the Pokemon example) to GitHub Pages. The solution should be reusable, efficient, and provide a good developer experience.

## Requirements

1. Automated deployment on push to main branch
2. Support for manual deployment triggers
3. Proper base path configuration for GitHub Pages
4. Efficient caching for dependencies and build artifacts
5. Preview deployments for pull requests (optional)
6. Support for custom domains

## Workflow Architecture

### Primary Workflow File

```yaml
# .github/workflows/deploy-pokemon-example.yml
name: Deploy Pokemon Example to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'examples/pokemon/**'
      - 'src/**'
      - 'package.json'
      - 'pnpm-lock.yaml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false
```

## Implementation Phases

### Phase 1: Basic Deployment

#### 1.1 Build Job

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build Polen
        run: pnpm build
        
      - name: Build Pokemon example
        working-directory: examples/pokemon
        run: |
          pnpm install
          pnpm build
        env:
          POLEN_BASE_PATH: /polen/examples/pokemon
```

#### 1.2 Deploy Job

```yaml
deploy:
  needs: build
  runs-on: ubuntu-latest
  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}
  steps:
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v3
```

### Phase 2: Enhanced Features

#### 2.1 Build Caching Strategy

```yaml
- name: Cache Polen build
  uses: actions/cache@v3
  with:
    path: |
      dist
      .turbo
    key: ${{ runner.os }}-polen-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-polen-
      
- name: Cache Pokemon example build
  uses: actions/cache@v3
  with:
    path: examples/pokemon/dist
    key: ${{ runner.os }}-pokemon-${{ hashFiles('examples/pokemon/**') }}
```

#### 2.2 Artifact Management

```yaml
- name: Upload artifact
  uses: actions/upload-pages-artifact@v2
  with:
    path: ./examples/pokemon/dist
    
- name: Setup Pages
  uses: actions/configure-pages@v4
  with:
    static_site_generator: vite
```

### Phase 3: Pull Request Previews

#### 3.1 PR Preview Workflow

```yaml
# .github/workflows/pr-preview.yml
name: PR Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - 'examples/pokemon/**'
      - 'src/**'

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Build steps...
      
      - name: Deploy preview
        uses: rossjrw/pr-preview-action@v1
        with:
          source-dir: ./examples/pokemon/dist
          preview-branch: gh-pages
          umbrella-dir: pr-preview
          action: deploy
```

## Configuration Requirements

### Polen Config Adjustments

```typescript
// examples/pokemon/polen.config.ts
export default defineConfig({
  // Base path configuration for GitHub Pages
  base: process.env.POLEN_BASE_PATH || '/',

  // Ensure proper asset handling
  build: {
    assetsDir: 'assets',
    sourcemap: false, // Reduce size for GH Pages
  },
})
```

### Vite Configuration

```typescript
// Ensure Vite respects base path
export default {
  base: process.env.POLEN_BASE_PATH || '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}
```

## Performance Optimizations

### 1. Dependency Caching

- Cache pnpm store between runs
- Use lock file hash as cache key
- Separate caches for root and example

### 2. Build Output Caching

- Cache Polen dist folder when src unchanged
- Skip rebuild if only example changed

### 3. Parallel Jobs

```yaml
jobs:
  build-polen:
    # Build Polen package
    
  build-example:
    needs: build-polen
    # Build Pokemon example
    
  deploy:
    needs: build-example
    # Deploy to GH Pages
```

## Error Handling

### Build Failures

```yaml
- name: Build with retry
  uses: nick-fields/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 2
    command: pnpm build
    
- name: Upload logs on failure
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: build-logs
    path: |
      npm-debug.log
      pnpm-debug.log
```

### Deployment Failures

- Automatic rollback to previous version
- Notification via GitHub Issues
- Detailed error logs

## Monitoring and Notifications

### Success Metrics

1. Build time tracking
2. Bundle size reporting
3. Deployment success rate

### Notifications

```yaml
- name: Notify on success
  if: success()
  run: |
    echo "::notice::Pokemon example deployed to ${{ steps.deployment.outputs.page_url }}"
    
- name: Create issue on failure
  if: failure()
  uses: actions/github-script@v6
  with:
    script: |
      github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: 'Pokemon example deployment failed',
        body: 'Deployment failed for commit ${{ github.sha }}'
      })
```

## Security Considerations

1. **Permissions**: Minimal required permissions
2. **Secrets**: No secrets needed for public deployment
3. **Token Handling**: Use GitHub's OIDC for Pages deployment
4. **Branch Protection**: Only deploy from main branch

## Future Enhancements

### 1. Multi-Example Support

```yaml
strategy:
  matrix:
    example: [pokemon, github, starwars]
```

### 2. Custom Domain Support

```yaml
- name: Configure custom domain
  run: echo "pokemon.polen.dev" > ./examples/pokemon/dist/CNAME
```

### 3. Performance Metrics

- Lighthouse CI integration
- Bundle size tracking
- Performance budgets

### 4. Versioned Deployments

- Deploy to `/v1/`, `/v2/` paths
- Version selector in UI
- Automatic cleanup of old versions

## Testing Strategy

1. **Workflow Testing**: Use act for local testing
2. **Build Testing**: Verify correct base paths
3. **Deployment Testing**: Check all assets load correctly
4. **Cross-browser Testing**: Automated tests on deployment

## Documentation

### User Documentation

```markdown
# Deploying to GitHub Pages

1. Fork the Polen repository
2. Enable GitHub Pages in repository settings
3. Push changes to trigger deployment
4. Access at: https://[username].github.io/polen/examples/pokemon
```

### Maintenance Documentation

- Workflow debugging guide
- Common issues and solutions
- Performance tuning tips

## References

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Deploy Pages](https://github.com/actions/deploy-pages)
- [Vite Static Deploy Guide](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [PR Preview Action](https://github.com/rossjrw/pr-preview-action)
