import type { Inputs } from '#lib/github-actions/step'
import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import type { GitHub } from '@actions/github/lib/utils.ts'
import { promises as fs } from 'node:fs'
import { $ } from 'zx'
import type { GitController } from './git-controller.ts'
import { createGitController } from './git-controller.ts'
import type { PullRequestController } from './pr-controller.ts'
import { createPullRequestController } from './pr-controller.ts'
import type { Context } from './runner-args-context.ts'

/**
 * Create a workflow context with all necessary tools
 */
export const createRunnerArgs = (stepName: string): RunnerArgs => {
  const githubToken = process.env[`GITHUB_TOKEN`]
  if (!githubToken) {
    throw new Error(`GITHUB_TOKEN environment variable is required`)
  }

  const github = getOctokit(githubToken)
  const pr = createPullRequestController(github, context, stepName)
  const git = createGitController($)

  return {
    core,
    github,
    context,
    $,
    fs,
    pr,
    git,
    inputs: {},
  }
}

/**
 * Arguments passed to the step's run function.
 *
 * @template $Inputs - The validated input values based on your inputs schema
 * @template $Context - The GitHub Actions context (validated if context schema provided)
 */
export interface RunnerArgs<$Inputs extends Inputs = Inputs, $Context = Context> {
  /** GitHub Actions core utilities for logging, setting outputs, etc. */
  core: typeof import('@actions/core')

  /** GitHub Actions context containing event payload, repo info, etc. */
  context: $Context

  /** Validated input values passed to the step */
  inputs: $Inputs

  /** Authenticated Octokit instance for GitHub API operations */
  github: InstanceType<typeof GitHub>

  /** zx's $ function for executing shell commands */
  $: typeof import('zx').$

  /** Node.js fs/promises module for file operations */
  fs: typeof import('node:fs/promises')

  /** PR controller for pull request operations (comment, review, etc.) */
  pr: PullRequestController

  /** Git controller for git operations (commit, push, etc.) without subprocess details */
  git: GitController
}
