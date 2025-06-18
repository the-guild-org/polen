# Conventional Commit Action

## Overview

The `commit` action is a composite GitHub Action that enforces conventional commits format while handling common git operations like checking for changes, staging files, committing, and optionally pushing.

## Features

1. **Conventional Commits Format**: Automatically formats commits according to the conventional commits specification
2. **Change Detection**: Only commits if there are actual changes
3. **Git Configuration**: Automatically configures git user (optional)
4. **Flexible Push**: Push is optional (defaults to true)
5. **Breaking Changes**: Support for breaking change notation with `!`
6. **Scoped Commits**: Optional scope for better organization
7. **Commit Body**: Optional body for detailed explanations

## Inputs

| Input               | Description                                                              | Required | Default |
| ------------------- | ------------------------------------------------------------------------ | -------- | ------- |
| `working-directory` | Working directory for git operations                                     | No       | `.`     |
| `type`              | Conventional commit type (feat, fix, docs, style, refactor, test, chore) | **Yes**  | -       |
| `scope`             | Component or area affected                                               | No       | -       |
| `message`           | Commit description                                                       | **Yes**  | -       |
| `body`              | Detailed explanation                                                     | No       | -       |
| `breaking`          | Whether this is a breaking change                                        | No       | `false` |
| `add-pattern`       | Pattern for git add                                                      | No       | `.`     |
| `configure-git`     | Whether to configure git user                                            | No       | `true`  |
| `push`              | Whether to push after committing                                         | No       | `true`  |

## Outputs

| Output        | Description                          |
| ------------- | ------------------------------------ |
| `has-changes` | Whether there were changes to commit |
| `committed`   | Whether changes were committed       |
| `pushed`      | Whether changes were pushed          |

## Usage Examples

### Basic Usage

```yaml
- name: Commit changes
  uses: ./.github/actions/commit
  with:
    type: chore
    message: "update dependencies"
```

### With Scope

```yaml
- name: Commit feature
  uses: ./.github/actions/commit
  with:
    type: feat
    scope: auth
    message: "add OAuth2 support"
```

### Breaking Change

```yaml
- name: Commit breaking change
  uses: ./.github/actions/commit
  with:
    type: feat
    scope: api
    message: "change response format"
    breaking: 'true'
    body: |
      BREAKING CHANGE: The API response format has changed.
      
      Before: { data: [...] }
      After: { items: [...], meta: {...} }
```

### Complex Example

```yaml
- name: Deploy cleaned gh-pages
  if: steps.gc.outputs.has_changes == 'true'
  uses: ./.github/actions/commit
  with:
    working-directory: gh-pages
    type: chore
    scope: demos
    message: "garbage collect past development cycle deployments"
    body: "Removed: ${{ steps.gc.outputs.removed_deployments }}"
    configure-git: 'true'
    push: 'true'
```

### Commit Without Push

```yaml
- name: Commit locally
  uses: ./.github/actions/commit
  with:
    type: fix
    message: "correct validation logic"
    push: 'false'
```

## Commit Message Format

The action generates commits following the conventional commits specification:

- `<type>: <message>` - Basic format
- `<type>(<scope>): <message>` - With scope
- `<type>!: <message>` - Breaking change
- `<type>(<scope>)!: <message>` - Breaking change with scope

Example outputs:

- `chore: update dependencies`
- `feat(auth): add OAuth2 support`
- `fix!: correct API endpoint`
- `feat(api)!: change response format`

## Workflows Using This Action

1. **demos-dist-tag.yaml**
   - Type: `chore`
   - Scope: `dist-tag`
   - Updates dist-tag pointers

2. **demos-garbage-collect.yaml**
   - Type: `chore`
   - Scope: `demos`
   - Cleans up old deployments
   - Uses body for removed deployments list
