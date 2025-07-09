# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Polen is a framework for building delightful GraphQL developer portals. It generates interactive documentation for GraphQL APIs including schema reference docs, changelogs, and custom pages.

## Essential Commands

### Development

- `pnpm dev` - Start development mode (watches for changes)
- `pnpm sandbox` or `pnpm sb` - Run sandbox.ts for quick testing

### Testing

- `pnpm test:unit` - Run unit tests
- `pnpm test:integration` - Run integration tests
- `pnpm test:examples` - Run e2e tests on example projects
- To run a single test: use Vitest's `-t` flag, e.g., `pnpm test:unit -t "test name"`

### Build & Quality

- `pnpm build` - Build the TypeScript project
- `pnpm check` - Run all checks (lint, types, format, package)
- `pnpm fix` - Auto-fix lint and format issues
- `pnpm check:types` - Run TypeScript type checking

### CLI Usage

- `npx polen build` - Build a developer portal
- `npx polen dev` - Start development server
- `npx polen open <graphql-endpoint>` - Instant schema explorer

## High-Level Architecture

### Module Organization

- **src/cli/** - Command-line interface
- **src/api/** - Core configuration and build system (defineConfig, schema handling, Vite plugins)
- **src/template/** - React-based UI components and routes
- **src/lib/** - Shared utilities (grafaid for GraphQL, file router, helpers)
- **src/dep/** - Wrapped external dependencies

### Key Architectural Patterns

1. **Internal Subpath Imports**: Uses `#*` imports configured in package.json and tsconfig.json
2. **Vite Plugin System**: Custom Vite plugins handle build, serve, and SSG/SSR modes
3. **Schema Sources**: Supports loading schemas from files, directories, or memory
4. **File Router**: Automatic route generation from file structure for custom pages
5. **Schema Augmentations**: Allows enhancing GraphQL schema descriptions programmatically

### Testing Architecture

- Unit tests are co-located with modules (`.test.ts` files)
- Type tests use `.test-d.ts` suffix and import type assertions from `@wollybeard/kit` Ts namespace
- Integration tests test granular features in isolation
- Example tests verify end-to-end functionality using real example projects

### Development Workflow

1. Run `pnpm dev` in one terminal for Polen development
2. Run example project commands in another terminal to test changes
3. Examples in `examples/` directory serve as both documentation and test sources

### Code Style Requirements

- Uses dprint for formatting (ASI, single quotes)
- Backticks for strings (except in test files due to Zed IDE limitation)
- No runtime dependencies allowed (all dependencies must be bundled)

## Development Rules

- After making changes, ensure all checks pass by running `pnpm fc` (includes lint (+autofix), format (+autofix), types, and package checks)
- Run tests relevant to your changes: `pnpm test:unit`, `pnpm test:integration`, or `pnpm test:examples`
- Use `pnpm fix` to auto-fix lint and format issues before committing

## Import Rules

- **NEVER** use child process exec to execute a script when you could ESM import it instead
- **NEVER** use ESM dynamic import when you could ESM statically import it instead

## TypeScript Execution Rules

- **CRITICAL**: We use tsx to execute TypeScript files
- All imports must use `.js` extensions (ESM requirement with nodenext module resolution)
- Node.js 24+ is still required for other features

## CI Debugging Rules

- When debugging CI issues, use the `gh` CLI to investigate logs, workflows, and deployments directly
- Check workflow runs, deployment statuses, and logs yourself before asking for debug information

## Local Libraries

Follow this layout:

```
src/lib/
  ├── <NAME: kebab case>/
  │   ├── index.ts                     (namespace export: `export * as <NAME: Pascal case> from './<NAME: kebab case>.ts'`)
  │   ├── index.test.ts                (optional test file, imports namespace)
  │   ├── <NAME: kebab case>.ts        (barrel export: `export * from './<...modules>.ts'`)
  │   ├── <...modules: kebab case>.ts  (code modules)
```
