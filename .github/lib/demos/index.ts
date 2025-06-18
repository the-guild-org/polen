/**
 * GitHub Actions specific demo functionality
 *
 * This module contains only the GitHub Actions workflow-specific code.
 * All reusable demo functionality is in src/lib/demos/
 */

// Core orchestration for GitHub Actions
export { DemoOrchestrator, demoOrchestrator } from './orchestrator.ts'
export type { BuildResult, GcResult } from './orchestrator.ts'

// UI components for landing pages (GitHub Actions specific)
export { DemoDataCollector } from './ui/data-collector.ts'
export { buildDemosHome } from './ui/landing-page.ts'
export type { BuildDemosHomeOptions } from './ui/landing-page.ts'
export { DemoPageRenderer, renderDemoLandingPage } from './ui/page-renderer.ts'

// Deployment utilities (GitHub Actions specific)
export { DeploymentPathManager } from './deployment/path-manager.ts'
export type { RedirectConfig } from './deployment/path-manager.ts'
