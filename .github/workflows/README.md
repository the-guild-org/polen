# GitHub Actions Workflows

This directory contains GitHub Actions workflows for Polen.

## Workflows

### deploy-demos.yml

Deploys the Polen demo sites to GitHub Pages when changes are pushed to the main branch.

**Features:**

- Builds both Pokemon and GitHub example demos
- Creates an index page listing all demos
- Deploys to GitHub Pages on main branch pushes
- Skips deployment for pull requests (build only)

**URL:** The demos will be available at `https://<username>.github.io/<repository>/`

### deploy-preview.yml

Creates preview deployments for pull requests using GitHub Pages sub-directories.

**Features:**

- Builds demos for every pull request
- Deploys to a unique GitHub Pages URL (e.g., `/pr-123/`)
- Comments on the PR with the preview URL
- Updates the deployment on new commits
- Automatically cleans up when PR is closed
- Creates an index page listing all active PR previews

**No additional secrets required** - uses the same GitHub Pages setup as the main deployment

## Setup Instructions

### GitHub Pages Setup

1. Go to Settings → Pages in your GitHub repository
2. Under "Source", select "GitHub Actions"
3. The workflow will automatically deploy on the next push to main

### PR Preview Setup

PR previews use the same GitHub Pages setup as the main deployment. They will be automatically deployed to sub-directories like:

- `https://<username>.github.io/<repository>/pr-123/`
- `https://<username>.github.io/<repository>/pr-124/`

An index page at `/pr-index.html` lists all active PR previews.

## Local Testing

To test the build process locally:

```bash
# Install dependencies
pnpm install

# Build Polen
pnpm build

# Build examples
cd examples/pokemon && pnpm build
cd ../github && pnpm build
```
