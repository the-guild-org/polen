# Polen Demos URL Structure

This document defines the URL structure for Polen's demo deployments on GitHub Pages.

## URL Structure

### Pull Request Demos

```
/polen/pr/:num                    → Landing page for this PR
/polen/pr/:num/latest/:demo       → Latest deployment from this PR (actual content)
/polen/pr/:num/:sha/:demo         → Specific deployment from this PR (actual content)

Redirects:
/polen/pr/:num/:demo              → /polen/pr/:num/latest/:demo
/polen/pr/:num/latest             → /polen/pr/:num
```

### Trunk (Main Branch) Demos

```
Primary URLs (actual content):
/polen                            → Main demos landing page
/polen/:semver/:demo              → Tagged release deployment (e.g., /polen/1.0.0/pokemon)

Redirects:
/polen/:demo                      → /polen/latest/:demo
/polen/latest/:demo               → /polen/:semver/:demo (latest stable)
/polen/next/:demo                 → /polen/:semver/:demo (latest prerelease)
```

Note: Trunk demos are only built on releases, not on every commit. This ensures demos match what's available on npm.

#### NPM Dist Tags Mapping

The `latest` and `next` URLs correspond to npm dist tags:

- **`latest`**: Points to the most recent stable release (non-prerelease). This matches the npm `latest` dist tag.
- **`next`**: Points to the most recent prerelease version. This matches the npm `next` dist tag.

When a new release is published:

- If it's a stable release (e.g., `1.0.0`), update `latest` to point to it
- If it's a prerelease (e.g., `1.0.0-beta.1`), update `next` to point to it

This allows users to always access:

- Stable demos at `/polen/latest/pokemon`
- Bleeding-edge demos at `/polen/next/pokemon`

## Current Implementation

### Trunk Demos

- **Build trigger**: Only on npm releases (not every commit)
- **Primary URLs**: `/polen/{semver}/{demo}` (e.g., `/polen/1.2.0/pokemon/`)
- **Dist-tag redirects**:
  - `/polen/latest/` → latest stable release
  - `/polen/next/` → latest prerelease
  - `/polen/latest/{demo}/` → latest stable release demo
  - `/polen/next/{demo}/` → latest prerelease demo
- **Convenience redirects**: `/polen/{demo}/` → `/polen/latest/{demo}/`

### Pull Request Demos

- **Build trigger**: Every commit to PR
- **URLs**:
  - `/polen/pr-{num}/` - PR landing page
  - `/polen/pr-{num}/latest/{demo}/` - Latest PR build
  - `/polen/pr-{num}/{sha}/{demo}/` - Specific commit build
- **Redirects**:
  - `/polen/pr-{num}/{demo}/` → `/polen/pr-{num}/latest/{demo}/`
  - `/polen/pr-{num}/latest/` → `/polen/pr-{num}/`

### Demo Filtering

Examples can be excluded from demos by adding `"demo": false` to their `package.json`.

### Adding New Examples

When you add a new example to the `examples/` directory:

1. It will automatically be included in future releases
2. To add it to existing releases, manually trigger the `demos-release-semver` workflow for each release tag
3. The workflow dynamically discovers examples, so no workflow changes are needed

### Garbage Collection

- **Stable releases**: Kept forever
- **Prereleases**: Only kept if they belong to the current "next" version
- **PR demos**: Automatically cleaned up when PR is closed/merged

## Workflow Details

### demos-release-semver.yaml

Triggered when:

- A GitHub release is published or edited
- Manually via GitHub Actions UI (workflow_dispatch)

This workflow:

1. Builds demos at `/polen/{semver}/` paths
2. Creates convenience redirects (`/polen/{demo}/` → `/polen/latest/{demo}/`)
3. Updates demos index page
4. Adds commit status with link to demos

**Manual Trigger**: Use this when adding new examples to rebuild demos for existing releases. Go to Actions → demos-release-semver → Run workflow → Enter a tag (e.g., `1.2.0` or `latest`)

### demos-release-dist-tag.yaml

Triggered when `latest` or `next` git tags are pushed. This workflow:

1. Finds which semver version the tag points to
2. Updates dist-tag redirects to point to that version

### demos-garbage-collector.yaml

Runs on schedule (daily). This workflow:

1. Identifies prereleases outside the current "next" range
2. Removes those old prerelease demos
3. Always keeps stable releases

## Technical Implementation

### Script Organization

```
.github/scripts/
├── lib/                    # Importable modules
│   ├── async-function.d.ts # GitHub Script type definitions
│   └── exec-utils.js       # Command execution utilities
├── steps/                  # Complete workflow steps
│   ├── identify-deployments-to-remove.js
│   ├── get-previous-pr-deployments.js
│   └── update-demos-index.js
└── tools/                  # CLI utilities
    ├── get-demo-examples.js
    ├── get-pr-deployments.js
    └── get-trunk-deployments.js
```

### Handling Mutable Releases

The "next" GitHub release is mutable - it gets updated rather than recreated when new prereleases are published. The `demos-release-semver.yaml` workflow handles this by:

1. Listening for both `published` and `edited` events
2. Finding the actual semver tag when "next" is edited
3. Building demos for that semver version
