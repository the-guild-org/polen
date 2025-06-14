// Common types for workflow steps

import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import { promises as fs } from 'node:fs'
import type { $ as zx$ } from 'zx'

type Context = typeof context
type GitHub = ReturnType<typeof getOctokit>

/**
 * Base arguments passed to all workflow steps
 */
export interface WorkflowStepArgs {
  context: Context
  core: typeof core
  github: GitHub
  // exec: typeof exec
  $: typeof zx$
  fs: typeof fs
  glob: typeof glob
  io: typeof io
  fetch: typeof fetch
  inputs: Record<string, any>
}

/**
 * Helper type for workflow steps with specific inputs
 */
export type WorkflowStep<TInputs = Record<string, any>> = (
  args: WorkflowStepArgs & { inputs: TInputs },
) => Promise<void>

/**
 * Extract args type for a workflow step
 */
export type WorkflowStepArgsFor<TInputs> = WorkflowStepArgs & { inputs: TInputs }

/**
 * Helper function to create a workflow step with typed inputs
 */
export function Step<TInputs = Record<string, any>>(
  handler: (args: WorkflowStepArgsFor<TInputs>) => Promise<void>,
): (args: WorkflowStepArgs) => Promise<void> {
  return handler as any
}

// Common input types
export interface RebuildInputs {
  versions_to_build: string[]
  dist_tags: Record<string, string>
  dry_run?: boolean
}

export interface PlanRebuildInputs {
  since_version?: string
  skip_versions?: string
  rebuild_dist_tags?: string
  dry_run?: boolean
}

export interface ReleaseInputs {
  github_event_name: string
  input_tag?: string
  github_release_tag_name?: string
  github_release_prerelease?: boolean
  github_event_action?: string
}

export interface BuildDemosInputs {
  tag: string
  actual_tag?: string
  is_dist_tag: boolean
}

export interface AddDemosLinkInputs {
  actual_tag: string
  github_event_name: string
  github_release_target_commitish?: string
}

// For steps with no inputs
export type EmptyInputs = Record<string, never>
