# Development

## Examples

- There are functional examples under `examples/*`
- These Examples are tested under `tests/examples/*`
- Motivation:
  - Runnable documentation for users
  - Development sandboxes for us (see [Developing With](#developing-with))
  - Sources for end to end tests (see [Testing](#testing))

### Developing With

Use two terminals

```sh
pnpm run dev
```

```sh
cd examples/<your-choice>
pnpm run dev
```

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

- dynamic on the fly projects to test granular permutations
- We run Polen via the API instead of CLI

```sh
pnpm test:integration
pnpm test:integration --ui
```

### E2E

- Static projects (reuses examples)
- Basically as real as a real user

```sh
pnpm test:examples
pnpm test:examples --ui
```

### CI

- `main` branch (trunk)
  - no checks
  - automatic pre-release
- pull requests
  - many checks

### Releases

- Automated pre-releases on `main` branch commits
- Manual releases from own machine `pnpm release`

## Internal Subpath Imports (ISI)

- We use [NodeJS internal subpath imports](https://nodejs.org/api/packages.html#subpath-imports).
- This makes refactoring easier for us.
- To achieve this we maintain three points of configuration. See next.

### `package.json` (`imports`)

- Used by NodeJS when running Polen CLI

### `tsconfig.json` (`compilerOptions.paths`)

- Used by TypeScript
- Some tools may refer to these to syncrhonize their path aliases, e.g.:
  - Playwright
  - Vitest
  - ...

### Vite Polen plugin (virtual modules)

- In part Polen is a library whose modules are used in the user's project runtime.
- Some of these modules are [Vite Virtual Modules](https://vitejs.dev/guide/api-plugin.html#virtual-modules) (dynamic code that is synthesized in memory, does not exist on disk)
- To allow those modules to use ISI we maintain an internal vite plugin that will resolve the imports correctly.

## Global Build Variables

Polen provides global build-time variables that are available within the Polen app runtime (but not the Polen tool itself). These variables are replaced at build time through Vite's `define` configuration and enable conditional logic based on the build context.

The variables allow you to:
- Write code that behaves differently in development vs production
- Optimize bundle sizes by excluding development-only code
- Implement architecture-specific code paths (SSG vs SSR)
- Conditionally load modules based on the build mode

For detailed documentation of each variable, see the type definitions in [`vite-env.d.ts`](./vite-env.d.ts).
