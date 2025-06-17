/**
 * Main exports for the demos system
 * 
 * This provides a clean API for accessing all demo functionality
 */

// Core orchestration
export { DemoOrchestrator, demoOrchestrator } from './orchestrator.ts'
export type { BuildResult, GcResult } from './orchestrator.ts'

// Configuration
export { DemoConfigManager, demoConfig } from './config.ts'
export type { DemoConfig } from './config.ts'

// UI components and rendering
export { DemoDataCollector } from './ui/data-collector.ts'
export { DemoPageRenderer, renderDemoLandingPage } from './ui/page-renderer.ts'
export { buildDemosHome } from './ui/landing-page.ts'
export type { BuildDemosHomeOptions } from './ui/landing-page.ts'

// Deployment utilities
export { DeploymentPathManager } from './deployment/path-manager.ts'
export type { RedirectConfig } from './deployment/path-manager.ts'

// Workflow steps
export * as ReleaseWorkflow from './workflows/release.ts'
export * as UpdateWorkflow from './workflows/update.ts'
export * as PreviewWorkflow from './workflows/preview.ts'
export * as DistTagWorkflow from './workflows/dist-tag.ts'

// Runner for executing workflow steps
export { runWorkflowStep, WORKFLOW_STEPS } from './runner.ts'

// Re-export shared utilities
export { 
  WorkflowError, 
  ValidationError, 
  ConfigurationError,
  safeExecute,
  executeWithContinuation 
} from '../shared/error-handling.ts'

export {
  defineWorkflowStep,
  WorkflowOrchestrator,
  CommonSchemas,
  createLegacyStep
} from '../shared/workflow-framework.ts'

export {
  GitVersionUtils,
  VersionUtils,
  createGitVersionUtils
} from '../shared/git-version-utils.ts'

export {
  configureGit,
  hasChangesToCommit,
  commitAndPush,
  createCommitMessage
} from '../shared/git-utils.ts'