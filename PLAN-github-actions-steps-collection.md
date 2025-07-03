# Plan: GitHub Actions Steps Collection API

## Overview

Create a new `createSteps` API that allows multiple workflow steps to be defined in a single file, with automatic type inference, shared configuration, and better ergonomics. Move step files to be colocated with workflow YAML files.

## Status: Phase 1 Complete ✓

## Completed Phases

### ✓ Phase 1: Core API Implementation (COMPLETED)

The core StepsCollection API has been implemented with:

- ✓ Created `src/lib/github-actions/create-steps.ts` with Brand type for type-safe identification
- ✓ Implemented overloaded `createSteps` function supporting both simple and configured modes
- ✓ Updated runner to detect and extract steps from collections
- ✓ Added helpful error messages in `previous` proxy showing exact YAML needed
- ✓ Updated module discovery to check `.github/workflows/<workflow-name>.steps.ts` first
- ✓ Re-exported from barrel file

## Remaining Phases

## Phase 2: Migration Pilot

### ✓ 2.1 Migrate demos-rebuild-current-cycle (Simplest) - COMPLETED

- ✓ Created `.github/workflows/demos-rebuild-current-cycle.steps.ts`
- ✓ Converted single step to use `createSteps` API
- ✓ Updated workflow YAML:
  - ✓ Referenced step by name (`build`)
  - ✓ Added workflow name to step action (`workflow: demos-rebuild-current-cycle`)
- ✓ Tested the workflow (discovery working, TypeScript compiles)
- ✓ Deleted old `.github/steps/demos-rebuild-current-cycle/` directory

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
