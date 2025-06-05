# Config Feature

## Goal

CLI commands read Polen config from polen.config.ts

## Technical Problem

- CLI commands read Vite config from polen.config.ts.
- Polen uses Vite.loadConfigFromFile to load the config file.
- Problem is that we cannot easily override Polen config input with overrides from CLI.
- Reason is that the result of Vite.loadConfigFromFile is Polen config input that is already:
  - Normalized
  - Merged into Vite config

## Technical Solution

- Polen CLI reads the config file itself using `import()`.

## Issue - NodeJS and TypeScript

### Problem

- Polen CLI is being run by a NodeJS process, so we must consider how it will import a TypeScript module.

### Solution 1

- We can register tsx as a loader
- tsx would need to become a dep, rather than devdep

### Solution 2

- Attempt this as a future improvement over the simpler solution 1
- We can use new NodeJS feature to strip types
- This requires Polen codebase to not be using runtime TS features like enums or runtime namespaces.
- It also requires a sufficient version of NodeJS

## Issue - Configuration Definition

### Problem

- Polen.defineConfig eagerly normalizes input and then transforms into a Vite Config.

### Solution

- That current function can become an internal utility, renamed.
- A new Polen.defineConfig function can be created that is just an identity function so users still have type safety.
- Then the internal utility is finally used before passing the config to Vite functions.

## Issue - Configuration Input Merging

### Problem

- We want CLI to be able to override config inputs.
- We have no generic way to merge two different config inputs.

### Solution

- Create a new utility function that merges two config inputs.
