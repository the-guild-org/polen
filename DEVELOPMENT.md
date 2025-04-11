# Development

## Examples

- We maintain fully working examples under `examples/*` (except directories
  prefixed with `_` which are for meta purposes like testing).
- These can help you with:
  - Your feature development (see [Developing With](#developing-with)).
  - Your testing of new Polen features (see [Testing](#testing)).

### Developing With

During local development you can link the source code with examples to try out
changes. to the example projects by running.

#### One Time System Setup

1. [`pnpm link`](https://pnpm.io/cli/link) in the root directory.

#### Session Setup

1. In an example project, run `pnpm link polen`.
2. In the root directory, run `pnpm run dev`.
3. When you are done, revert the change to the example's `package.json` in
   regards to the `polen` dependency having become a link.

#### Notes

1. `pnpm link` will result in a `pnpm-workspace.yaml` file in the example
   project directory. These files are ignored via `.gitignore` and so will never
   be committed.

### Testing

- All examples are tested using Playwright under `examples/_tests/`.
- You can think of these as E2E (end-to-end) tests.
- Run them manually with `pnpm test:examples`.
- They are also run in GitHub Actions against pull requests.
- By default, in CI, tests use the local Polen version (via pnpm file:).
  Otherwise they use the registry version. This is a
  [Playwright fixture option](https://playwright.dev/docs/test-fixtures#fixtures-options)
  that you can override. There is also an option to use a local Polen version
  via pnpm `link:`.
