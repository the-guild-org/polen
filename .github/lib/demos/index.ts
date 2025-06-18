/**
 * Main exports for the demos system
 *
 * This provides a clean API for accessing all demo functionality
 */

// Core orchestration
export { DemoOrchestrator, demoOrchestrator } from './orchestrator.ts'
export type { BuildResult, GcResult } from './orchestrator.ts'

// Configuration
export { demoConfig, DemoConfigManager } from './config.ts'
export type { DemoConfig } from './config.ts'

// UI components and rendering
export { DemoDataCollector } from './ui/data-collector.ts'
export { buildDemosHome } from './ui/landing-page.ts'
export type { BuildDemosHomeOptions } from './ui/landing-page.ts'
export { DemoPageRenderer, renderDemoLandingPage } from './ui/page-renderer.ts'

// Deployment utilities
export { DeploymentPathManager } from './deployment/path-manager.ts'
export type { RedirectConfig } from './deployment/path-manager.ts'

// Utilities
export { getDemoExamples } from './utils/get-demo-examples.ts'

// Re-export utilities from main library
export { createWorkflowContext } from '../../../src/lib/github-actions/index.ts'

// Re-export shared utilities
export {
  ConfigurationError,
  executeWithContinuation,
  safeExecute,
  ValidationError,
  WorkflowError,
} from '../../../src/lib/github-actions/error-handling.ts'

export { CommonSchemas, defineWorkflowStep, WorkflowOrchestrator } from '../../../src/lib/github-actions/index.ts'

export { commitAndPush, configureGit, createCommitMessage, hasChangesToCommit } from '../shared/git-utils.ts'
