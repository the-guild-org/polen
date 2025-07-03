# Plan: GitHub Actions Steps Collection API

## Overview

Create a new `createSteps` API that allows multiple workflow steps to be defined in a single file, with automatic type inference, shared configuration, and better ergonomics. Move step files to be colocated with workflow YAML files.

## Status: Not Started

## Phase 1: Core API Implementation

### 1.1 Create Steps Collection Module

- [ ] Create `src/lib/github-actions/create-steps.ts`
  - [ ] Define `StepsCollection` type with discriminated union for simple vs configured mode
  - [ ] Define `StepDefinition` types that support both object and function shorthand
  - [ ] Create `ConfigDefinition` and `SetupFunction` types
  - [ ] Implement proper type inference for `previous` context with namespaced outputs
  - [ ] Use `Brand` type from kit-temp for type-safe StepsCollection identification

### 1.2 Implement createSteps Function

- [ ] In `src/lib/github-actions/create-steps.ts`:
  - [ ] Add overloaded `createSteps` function signatures
  - [ ] Simple mode: `createSteps(steps)`
  - [ ] Config mode: `createSteps({ config?, setup?, steps })`
  - [ ] Return a `StepsCollection` object with metadata for discovery
- [ ] Re-export from `src/lib/github-actions/github-actions.ts` barrel file

### 1.3 Update Step Runner

- [ ] Modify `src/lib/github-actions/runner.ts`:
  - [ ] Add support for importing and detecting steps collections (use Brand type check)
  - [ ] Implement step extraction from collection by name
  - [ ] Create the `previous` proxy with helpful error messages showing exact YAML needed
  - [ ] Handle `setup` function execution and result injection
  - [ ] Apply shared `config` to all steps

### 1.4 Update Module Discovery

- [ ] Modify `src/lib/github-actions/search-module.ts`:
  - [ ] Add search pattern for `.github/workflows/<workflow-name>.steps.ts`
  - [ ] Check if module default export is a steps collection
  - [ ] Extract individual step from collection when found

## Phase 2: Migration Pilot

### 2.1 Migrate demos-rebuild-current-cycle (Simplest)

- [ ] Create `.github/workflows/demos-rebuild-current-cycle.steps.ts`
- [ ] Convert single step to use `createSteps` API
- [ ] Update workflow YAML:
  - [ ] Reference step by name
  - [ ] Add workflow name to step action
- [ ] Test the workflow
- [ ] Delete old `.github/steps/demos-rebuild-current-cycle/` directory

### 2.2 Migrate demos-build-on-release-semver (Multiple Steps)

- [ ] Create `.github/workflows/demos-build-on-release-semver.steps.ts`
- [ ] Combine all 3 steps into collection:
  - [ ] extractReleaseInfo
  - [ ] build
  - [ ] addDemosLink
- [ ] Use the new `previous` namespace pattern
- [ ] Update workflow YAML:
  - [ ] Update step IDs to match collection names
  - [ ] Wire up `previous` with namespace structure
- [ ] Test the full workflow
- [ ] Delete old `.github/steps/demos-build-on-release-semver/` directory

## Phase 3: Helper Tools

### 3.1 Create CLI for Workflow Operations

- [ ] Create `src/cli/commands/github/cli.ts`
  - [ ] Add `generate-snippet` subcommand:
    - [ ] Parse a `.steps.ts` file
    - [ ] Analyze step dependencies (which steps use `previous`)
    - [ ] Generate correct YAML snippet with proper `previous` wiring
    - [ ] Include helpful comments about dependencies
  - [ ] Add `validate` subcommand:
    - [ ] Check that workflow YAML step IDs match step names in collection
    - [ ] Verify `previous` wiring matches actual dependencies
    - [ ] Warn about unused steps or missing dependencies

## Phase 4: Complete Migration

### 4.1 Migrate Remaining Workflows

- [ ] `demos-build-on-change-dist-tag`
  - [ ] Create `.github/workflows/demos-build-on-change-dist-tag.steps.ts`
  - [ ] Update workflow YAML
  - [ ] Test and remove old directory
- [ ] PR workflows:
  - [ ] Create `.github/workflows/pr.steps.ts` (combine demos-build and demos-deploy-comment)
  - [ ] Update workflow YAML references
  - [ ] Test and remove old directories

### 4.2 Cleanup

- [ ] Remove empty `.github/steps/` directory structure
- [ ] Update any import statements that referenced old locations

## Phase 5: Documentation

### 5.1 Update Documentation

- [ ] Update `CLAUDE.md` with new patterns
- [ ] Create examples in documentation showing:
  - [ ] Simple steps collection
  - [ ] Steps with shared config/setup
  - [ ] Steps with complex dependencies

### 5.2 Create Migration Guide

- [ ] Document the migration process
- [ ] Show before/after examples
- [ ] Explain the benefits and new patterns

## Success Criteria

- [ ] All workflows migrated to new pattern
- [ ] All tests pass
- [ ] Type inference works correctly for `previous` context
- [ ] Helpful error messages when YAML wiring is incorrect
- [ ] CLI generates correct YAML snippets
- [ ] No regression in functionality

## Notes

- Keep backward compatibility during migration
- Each phase should be independently testable
- Prioritize developer experience improvements
- Use Brand type for StepsCollection: `Brand<StepsCollectionData, 'GitHubActionsStepsCollection'>`
  - This provides type-safe runtime detection without manual markers
  - The runner can check if a value has the brand to determine if it's a steps collection
