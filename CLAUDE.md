# Polen Project

## Overview

- Polen is a framework for building delightful GraphQL developer portals
- It generates interactive documentation for GraphQL APIs including schema reference docs, changelogs, and custom pages

## Project Structure

```
src/
├── cli/         # Command-line interface
├── api/         # Core configuration and build system (defineConfig, schema handling, Vite plugins)
├── template/    # React-based UI components and routes
├── lib/         # Shared utilities (grafaid for GraphQL, file router, helpers)
└── dep/         # Wrapped external dependencies
```

## Polen-Specific Guidelines

### Test Utils

Polen has a sophisticated test utility library at `/tests/unit/helpers/test.ts` that **MUST** be used for all table-driven tests. See system-level testing documentation for Test.suite usage patterns.

### Important Instruction Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Note

Most conventions have been moved to the system-level CLAUDE.md (~/.claude/CLAUDE.md) to avoid duplication. This includes:

- Effect patterns and Schema conventions
- Local library structure and import patterns
- Async/await rules for src/api and src/lib
- Testing patterns and Test.suite usage
- MCP usage guidelines (ref, exa, serena, effect-docs)
- Script execution rules
- TDD requirements for bug fixes
