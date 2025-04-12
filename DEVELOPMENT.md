# Development

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

1. [`pnpm link`](https://pnpm.io/cli/link) in the root directory. -->

#### Session Setup

1. In the root directory, run `pnpm run dev` (to have TS source being emitted as
   JS)
2. In an example project:
   1. Run `pnpm link ../..`
   2. Run `pnpm run dev`
   3. Now open the example app (http://localhost:5173)
   4. When you are done, revert the changes caused by step 2.1 to
      `pnpm-lock.yaml`

#### Notes

1. `pnpm link` will result in a `pnpm-workspace.yaml` file in the example
   project directory. These files are ignored via `.gitignore` and so will never
   be committed.

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

#### Notes

Keep in mind that if you are doing [Developing With](#developing-with), you will
necessarily impact that example's test such that it will be using the local
Polen version.
