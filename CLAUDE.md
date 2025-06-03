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
- `pnpm check:lint` - Run ESLint

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
- Integration tests test granular features in isolation
- Example tests verify end-to-end functionality using real example projects

### Development Workflow

1. Run `pnpm dev` in one terminal for Polen development
2. Run example project commands in another terminal to test changes
3. Examples in `examples/` directory serve as both documentation and test sources

### Code Style Requirements

- Uses dprint for formatting (ASI, single quotes)
- ESLint with TypeScript rules
- Backticks for strings (except in test files due to Zed IDE limitation)
- No runtime dependencies allowed (all dependencies must be bundled)
