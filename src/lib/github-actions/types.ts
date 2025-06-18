/**
 * Common types for GitHub Actions workflows
 */

import type { WorkflowContext } from './step.ts'

// Re-export workflow context for convenience
export type { WorkflowContext }

// Workflow step function type
export type WorkflowStep<TInputs = Record<string, any>> = (
  context: WorkflowContext,
  inputs: TInputs,
) => Promise<void>

// Workflow results
export interface WorkflowResult {
  success: boolean
  message?: string
  data?: any
  error?: Error
}

// Deployment information
export interface DeploymentInfo {
  sha: string
  shortSha: string
  tag?: string
  prNumber?: string
  timestamp?: string
}

// Version information
export interface VersionInfo {
  tag: string
  commit: string
  date: Date
  isPrerelease: boolean
}
