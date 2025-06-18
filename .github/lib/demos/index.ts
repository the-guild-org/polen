/**
 * GitHub Actions specific demo functionality
 *
 * This module contains only the GitHub Actions workflow-specific code.
 * All reusable demo functionality is in src/lib/demos/
 */

// Core orchestration for GitHub Actions
export { DemoOrchestrator, demoOrchestrator } from './orchestrator.ts'
export type { BuildResult, GcResult } from './orchestrator.ts'

// Deployment utilities (GitHub Actions specific)
export { DeploymentPathManager } from './path-manager.ts'
export type { RedirectConfig } from './path-manager.ts'
