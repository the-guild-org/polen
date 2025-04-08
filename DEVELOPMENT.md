# Development

## Working With Examples

During local development you can link the source code with examples to try out
changes. to the example projects by running.

#### One Time Setup

1. [`pnpm link`](https://pnpm.io/cli/link) in the root directory.

#### Workflow

1. In an example project, run `pnpm link polen`.
2. In the root directory, run `pnpm run dev`.
3. When you are done, revert the change to the example's `package.json` in
   regards to the `polen` dependency having become a link.
