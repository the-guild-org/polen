# Development

## Local Imports

- We use local imports to avoid repeated fragile relative imports of certain
  modules in our source code.
- This makes refactoring easier for us.
- To achieve this we maintain three points of configuration. See next.

### Source of truth, `package.json` (`imports`)

- Since NodeJS has this feature as a standard for the whole community it feels
  right to make it our source of truth.
- When the Polen CLI runs or static imports against Polen for the user's Vite
  config take place then NodeJS's support is going to be handling the resolution
  process.

### Mirror configuration in `tsconfig.json` (`compilerOptions.paths`)

This configuration is used by tools that run against our source code rather than
the build such as:

- Playwright
- Vitest
- ESLint
- TypeScript

### Vite Polen plugin

When a user's project uses Vite and the Vite Polen plugin we need Vite to be
able to resolve our local imports in source code. We canot rely on NodeJS to
since it is not the process crawling the Polen package. So we resolve the local
import paths in the Vite Polen plugin using the Rollup `resolveId` hook.

## Examples

- We maintain fully working examples under `examples/*`
- Directories prefixed with `_` are for meta purposes (like testing).

### Why

- Functions as runnable documentation for users
- Functions as development sandboxes for us (see
  [Developing With](#developing-with))
- Functions as sources for end to end tests (see [Testing](#testing))

### Developing With

During local development you can link the source code with examples to try out
changes. to the example projects by running.

<!-- #### One Time System Setup
TODO: Waiting on https://github.com/orgs/pnpm/discussions/9411
1. [`pnpm link`](https://pnpm.io/cli/link) in the root directory. -->

#### Session Setup

1. In the root directory, run `pnpm run dev` (to have TS source being emitted as
   JS)
2. In an example project:
   1. Run `pnpm link ../..`
   2. Run `pnpm run dev`
   3. Now open the example app (http://localhost:5173)
   4. When you are done revert changes caused by step 2.1 by running
      `pnpm run examples:unlink`

### Developing With _Strictly_

Because examples are nested within this project it leads to strange beahviours
like node resolution going into this project's node_modules and thus
[masking bugs](https://github.com/the-guild-org/polen/issues/11).

To get around this copy the example to a temporary location and develop with it
there.

There is a project CLI to make this easy, check
`pnpm run project:example-controller --help`.

### Testing

#### Overview

- All examples are tested using Playwright under `examples/_tests/`.
- You can think of these as E2E (end-to-end) tests.
- Run them manually with `pnpm test:examples`.
- They are also run in GitHub Actions against pull requests.

#### Polen Version

- By default, in CI, tests use the local Polen version (via pnpm file:).
- Otherwise they use the registry version.
- There is also an option to use a local Polen version via pnpm `link:`.
- This is a
  [Playwright fixture option](https://playwright.dev/docs/test-fixtures#fixtures-options)
  that you can override.
