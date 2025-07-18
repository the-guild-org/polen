# Development

## Quickstart

```sh
pnpm install
# Run development mode:
pnpm polen dev examples/hive
```

## Architectural Pillars Overview

### App

- `src/template`
- The basis of the Polen app, a Vite app
- Extended by the user's project
- Import: Is the Vite root directory (NOT the user's project directory root)

### CLI

- `src/cli`
- The CLI tool that runs the Polen app
- Wraps Vite API (serve, build, etc.)
- Uses the user's project directory root as the working directory

### API

- `src/api`
- The API that the CLI uses to run the Polen app
- Provides a programmatic interface to the Polen app

## Implementation Notes

- Vite
  - Using Vite Rolldown (Not Rollup!)

## Source Code Layout

Each pillar has its own root directory in source:

```
/api -> API
/cli -> CLI
/template -> App
```

Other:

```
/lib -> Abstractions to keep pillars code high level
/dep -> Re-exported dependencies for namespaces and sometimes additional seamless functionality
```

## Package

- The TypeScript source code is directly runnable by NodeJS.
- You can run the Polen CLI directly from the source code using `pnpm polen ...`.

### Internal Subpath Imports (ISI)

- We use [NodeJS internal subpath imports](https://nodejs.org/api/packages.html#subpath-imports).
- Why
  - Easier refactoring
- How
  - `package.json` (`imports`)
    - Used by NodeJS when running Polen CLI
  - `tsconfig.json` (`compilerOptions.paths`)
    - Used by TypeScript
    - Some tools may refer to these to syncrhonize their path aliases, e.g.:
      - Playwright
      - Vitest
      - ...
  - Vite Plugin
    - Within Polen is an app used by the user's Polen project runtime.
    - Some of these modules are [Vite Virtual Modules (VVM)](https://vitejs.dev/guide/api-plugin.html#virtual-modules) (dynamic code that is synthesized in memory, does not exist on disk)
    - VVM do not support ISI by default
    - To allow those modules to use ISI we maintain an internal vite plugin to apply ISI

## Examples

- There are functional examples under `examples/*`
- These Examples are tested under `tests/examples/*`
- Motivation:
  - Runnable documentation for users
  - Development sandboxes for us (see [Developing With](#developing-with))
  - Sources for end to end tests (see [Testing](#testing))

## Testing

- We have three kinds of tests
- Most should be integration

### Unit

- Sometimes we write unit tests.
- We co-locate them next to the modules they cover with .test.ts suffix.

```sh
pnpm test:integration
pnpm test:integration --ui
```

### Integration

- Why
  - Faster that E2E, cover more cases
- How
  - Uses API (not CLI)
  - Dynamic on the fly projects to test many cases

```sh
pnpm test:integration
pnpm test:integration --ui
```

### E2E

- Why
  - Real world testing
- How
  - We use our examples for the base of E2E tests

```sh
pnpm test:examples
pnpm test:examples --ui
```

## Repository & CI

- Using Git, GitHub, GitHub Actions
- Trunk Branch
  - `main`
  - CI
    - No checks
    - Automatic pre-release
- Feature Branches
  - Become Pull Requests
  - Merged directly into trunk
  - CI
    - Exhaustive checks

## Releases

- Using Dripip
- Pre-releases
  - CI automated on every trunk commit
- Releases
  - Manual from own machine
  - `pnpm release`

### Fixing Corrupted Release State

If the CI fails with an npm publish error like "You cannot publish over the previously published versions", it means the npm registry has a version that doesn't have a corresponding git tag. This breaks dripip's ability to determine the next version.

To fix this:

1. **Identify the missing tag**
   ```sh
   # Check what's published on npm
   npm view polen versions --json | tail -20

   # Check what tags exist in git
   git tag -l | grep "0.10.0" | sort -V
   ```

2. **Find the correct commit for the missing tag**
   - The tag must be placed AFTER the previous version tag
   - Look for commits around the npm publish time: `npm view polen@VERSION time.created`

3. **Create and push the missing tag**
   ```sh
   # Create tag on the correct commit
   git tag 0.10.0-next.14 COMMIT_HASH

   # Push to GitHub
   git push origin 0.10.0-next.14
   ```

4. **Force an empty commit to trigger a new release**
   ```sh
   git commit --allow-empty -m "fix: trigger release"
   git push
   ```

This will allow dripip to see the existing version and increment properly for the next release.

## Architectural Pillars

### App

- Using Radix UI Themes
- Guidelines
  - Prefer using Radix UI primitives when available over native HTML elements
  - Pefer using Radix component props where available (pr='4' instead of style paddingRight)

#### Global Build Variables

Polen provides global build-time variables that are available within the Polen app runtime (but not the Polen tool itself). These variables are replaced at build time through Vite's `define` configuration and enable conditional logic based on the build context.

The variables allow you to branch code in the app:

- Write code that behaves differently in development vs production
- Optimize bundle sizes by excluding development-only code
- Implement architecture-specific code paths (SSG vs SSR)
- Conditionally load modules based on the build mode

For detailed documentation of each variable, see the type definitions in [`vite-env.d.ts`](./vite-env.d.ts).
