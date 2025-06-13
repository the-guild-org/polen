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

### Garbage Collection

- **Stable releases**: Kept forever
- **Prereleases**: Only kept if they belong to the current "next" version
- **PR demos**: Automatically cleaned up when PR is closed/merged

## Information Architecture Improvements

### Current Issues

1. **Inconsistent canonical URLs**: Tagged releases redirect to SHA URLs instead of tag URLs being canonical
2. **Mixed deployment types**: SHA and tag deployments coexist at the same level
3. **No clear hierarchy**: Latest, tagged releases, and commit deployments are peers

### Proposed Improvements

#### Option 1: Separate Release and Commit Paths (Recommended)

```
/polen/releases/                  → All releases index
/polen/releases/:semver/:demo     → Tagged release (canonical)
/polen/commits/:sha/:demo         → Commit deployment
/polen/latest/:demo               → Latest deployment (symlink/redirect)
```

Benefits:

- Clear separation between stable releases and development commits
- Easier to browse and discover releases
- Cleaner URL structure

#### Option 2: Nested Version Structure

```
/polen/v/:semver/:demo            → Tagged release (v prefix for clarity)
/polen/c/:sha/:demo               → Commit deployment (c prefix)
/polen/latest/:demo               → Latest deployment
```

Benefits:

- Shorter URLs
- Clear distinction with prefixes
- Maintains flat structure

#### Option 3: Keep Current Structure but Fix Canonical URLs

- Make tag URLs canonical (SHA redirects to tag when available)
- Implement the SHA→tag conversion on release
- Keep the flat structure

Benefits:

- Minimal change to existing structure
- Maintains backward compatibility
- Simplest to implement

## Implementation Notes

### Tag to SHA Conversion Process

When a release is created:

1. Move `/polen/:sha` directory to `/polen/:semver`
2. Find-replace all `:sha` references with `:semver` in static files
3. Create redirect from `/polen/:sha` to `/polen/:semver`
4. Rebuild demos landing page with updated links

### Considerations

- **Caching**: CDN and browser caches may serve old URLs
- **SEO**: Redirects should use proper meta refresh or JavaScript
- **Backwards compatibility**: Old SHA URLs should continue to work
- **Performance**: Moving/renaming is more efficient than copying
