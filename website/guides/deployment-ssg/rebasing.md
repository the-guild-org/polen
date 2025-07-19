# Rebasing

The static rebase feature allows you to update the base path of a Polen build after it has been generated. This is useful for deploying the same build to different URL paths without rebuilding.

## Overview

When Polen generates a static site (SSG mode), it creates HTML files with absolute paths based on the `basePath` configuration. The rebase feature can update these paths in-place or create a copy with new paths.

## CLI Usage

### Basic Usage

```bash
npx polen static rebase <source-path> --new-base-path <path>
```

### Options

- `<source-path>` - Path to the Polen build directory (contains `.polen/build.json`)
- `--new-base-path` - New base path for the build (must start and end with `/`)
- `--mode` - Change mode: `mutate` (default) or `copy`
- `--target` - Target directory (required when using `copy` mode)

### Examples

#### Update paths in-place

```bash
npx polen static rebase ./build --new-base-path /docs/v2/
```

#### Create a copy with new paths

```bash
npx polen static rebase ./build --new-base-path /docs/v2/ --mode copy --target ./build-v2
```

## How It Works

The rebase process:

1. Validates the source directory is a valid Polen build (checks for `.polen/build.json`)
2. Validates the new base path format
3. Updates all HTML files to use the new base path
4. Updates the build manifest with the new base path

### What Gets Updated

- `<base href="...">` tags in all HTML files
- The `basePath` field in `.polen/build.json`

### Requirements

- Source must be a valid Polen SSG build
- New base path must start and end with `/`
- When using copy mode, target directory must not exist or be empty

## Use Cases

### Multiple Deployment Environments

Deploy the same build to different environments without rebuilding:

```bash
# Build once
npx polen build --base-path /staging/

# Deploy to production with different path
npx polen static rebase ./build --new-base-path /production/ --mode copy --target ./build-prod
```

### PR Preview Deployments

Automatically adjust paths for pull request previews:

```bash
# Original build
npx polen build

# Rebase for PR preview
npx polen static rebase ./build --new-base-path /pr-123/
```

### Version-Specific Paths

Deploy documentation for multiple versions:

```bash
# Build latest version
npx polen build

# Create version-specific deployments
npx polen static rebase ./build --new-base-path /v1.0/ --mode copy --target ./build-v1.0
npx polen static rebase ./build --new-base-path /v1.1/ --mode copy --target ./build-v1.1
```

## Error Handling

The rebase command will fail if:

- Source path is not a valid Polen build
- New base path doesn't start and end with `/`
- Target directory exists and is not empty (in copy mode)
- HTML files cannot be parsed or updated
