# GitHub Actions Workflow Audit Report

## 1. Duplicate Patterns That Could Be Made DRY

### Common Setup Pattern
Every workflow repeats this exact sequence:
```yaml
- name: Checkout
  uses: actions/checkout@v4
- name: Setup
  uses: ./.github/actions/setup
```

This appears in:
- `pr.yaml` (7 times across different jobs)
- `demos-preview.yaml`
- `demos-release.yaml`
- `demos-dist-tag.yaml`
- `demos-update.yaml`
- `demos-garbage-collect.yaml`

### Build and Re-install Pattern
This pattern appears in multiple workflows:
```yaml
- name: Build Polen
  run: pnpm build
- name: Re-install to link workspace packages
  run: pnpm install
```

Found in:
- `pr.yaml` (tests-integration and tests-e2e jobs)
- `demos-preview.yaml`
- `demos-release.yaml`
- `demos-update.yaml`
- `demos-garbage-collect.yaml`

### Playwright Setup Pattern
For tests requiring Playwright:
```yaml
- name: Install Playwright browsers
  uses: ./.github/actions/install-playwright-binaries
```

This appears in:
- `pr.yaml` (tests-integration and tests-e2e jobs)
- `_playwright-test.yaml` (reusable workflow)

### Git Configuration Pattern
Multiple workflows configure git manually instead of using the existing action:
```yaml
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
```

This appears in:
- `demos-dist-tag.yaml`
- `demos-garbage-collect.yaml`
- Already extracted to `.github/actions/configure-git/action.yaml` but not used consistently

## 2. Workflow Job Partitioning Analysis

### PR Workflow (`pr.yaml`)
- Has 7 separate jobs that all do essentially the same setup
- Could potentially combine related checks (format, types, lint-package) into a single job
- Tests could remain separate for parallel execution

### Demos Workflows
- Good separation of concerns between preview, release, dist-tag, and update workflows
- However, each repeats similar build steps

## 3. Common Setup Steps That Could Be Extracted

### Polen Build Setup
A composite action could handle:
```yaml
- Checkout
- Setup
- Build Polen
- Re-install to link workspace packages
```

### Test Setup
For test jobs requiring Playwright:
```yaml
- Checkout
- Setup
- Install Playwright browsers
- Build Polen
- Re-install
```

### Deployment Preparation
Common pattern for demos deployment:
```yaml
- Checkout
- Setup
- Build Polen
- Re-install
- Run step action
- Deploy to GitHub Pages
```

## 4. Repeated Code Patterns in Step Implementations

### Error Handling Pattern
All step implementations follow similar error handling:
```typescript
if (!result.success) {
  const errorMessages = result.errors.map(e => e.message).join(', ')
  throw new Error(`Failed to [action]: ${errorMessages}`)
}
```

### Input/Output Schema Pattern
Every step follows the same pattern with Zod schemas:
```typescript
const Inputs = z.object({...})
const Outputs = z.object({...})
export default defineWorkflowStep({
  name: '...',
  description: '...',
  inputs: Inputs,
  outputs: Outputs,
  async execute({ inputs }) {...}
})
```

## 5. Opportunities to Consolidate Similar Workflows

### Create Reusable Workflows

1. **Polen Build Workflow**: Extract the common build pattern into a reusable workflow
2. **Check Suite Workflow**: Combine format, types, and lint checks into one reusable workflow
3. **Demo Build Workflow**: Extract common demo building logic

### Suggested Refactorings

#### 1. Create `.github/workflows/_build-polen.yaml`:
```yaml
name: build-polen
on:
  workflow_call:
    inputs:
      install-playwright:
        type: boolean
        default: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup
      - run: pnpm build
      - run: pnpm install
      - if: inputs.install-playwright
        uses: ./.github/actions/install-playwright-binaries
```

#### 2. Create `.github/workflows/_checks.yaml`:
```yaml
name: checks
on:
  workflow_call:

jobs:
  all-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup
      - run: pnpm build
      - run: |
          pnpm check:format
          pnpm check:types
          pnpm check:pedantic:package
```

#### 3. Update workflows to use the configure-git action:
Replace manual git config with:
```yaml
- uses: ./.github/actions/configure-git
```

#### 4. Create a composite action for demo deployments:
`.github/actions/deploy-demos/action.yaml` that encapsulates the common pattern of building and deploying demos.

## Benefits of These Refactorings

1. **Reduced Duplication**: Less copy-paste across workflows
2. **Improved Maintainability**: Changes to common patterns only need to be made in one place
3. **Better Consistency**: Ensures all workflows follow the same patterns
4. **Faster Development**: New workflows can reuse existing building blocks
5. **Easier Testing**: Reusable workflows can be tested independently