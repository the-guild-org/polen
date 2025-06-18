/**
 * GitHub Actions context schemas with proper typing for event payloads
 * Based on GitHub's official webhook documentation
 */

import { z } from 'zod/v4'

/**
 * GitHub user information
 */
const User = z.object({
  /** User's login username */
  login: z.string(),
  /** Unique user ID */
  id: z.number(),
  /** Node ID for GraphQL */
  node_id: z.string(),
  /** URL to user's avatar image */
  avatar_url: z.string(),
  /** URL to user's GitHub profile */
  html_url: z.string().optional(),
  /** User type (e.g., 'User', 'Bot') */
  type: z.string(),
  /** Whether user is a site administrator */
  site_admin: z.boolean(),
})

/**
 * Repository information
 */
const Repository = z.object({
  /** Unique repository ID */
  id: z.number(),
  /** Node ID for GraphQL */
  node_id: z.string(),
  /** Repository name (without owner) */
  name: z.string(),
  /** Full repository name (owner/name) */
  full_name: z.string(),
  /** Whether repository is private */
  private: z.boolean(),
  /** Repository owner */
  owner: User,
  /** Repository's GitHub page URL */
  html_url: z.string(),
  /** Repository description */
  description: z.string().nullable(),
  /** Whether repository is a fork */
  fork: z.boolean(),
  /** ISO 8601 timestamp of repository creation */
  created_at: z.string(),
  /** ISO 8601 timestamp of last update */
  updated_at: z.string(),
  /** ISO 8601 timestamp of last push */
  pushed_at: z.string(),
  /** Git clone URL */
  git_url: z.string(),
  /** SSH clone URL */
  ssh_url: z.string(),
  /** HTTPS clone URL */
  clone_url: z.string(),
  /** Default branch name */
  default_branch: z.string(),
})

/**
 * Git reference (branch/tag) information
 */
const GitRef = z.object({
  /** Label including owner prefix (e.g., 'owner:branch-name') */
  label: z.string(),
  /** Reference name (e.g., 'main', 'feature-branch') */
  ref: z.string(),
  /** Commit SHA for this reference */
  sha: z.string(),
  /** User who owns the reference */
  user: User,
  /** Repository containing this reference */
  repo: Repository,
})

/**
 * Pull request information
 */
const PullRequest = z.object({
  /** API URL for this pull request */
  url: z.string(),
  /** Unique pull request ID */
  id: z.number(),
  /** Node ID for GraphQL */
  node_id: z.string(),
  /** HTML URL to view pull request on GitHub */
  html_url: z.string(),
  /** Pull request number (unique per repository) */
  number: z.number(),
  /** Current state: 'open' or 'closed' */
  state: z.enum(['open', 'closed']),
  /** Whether pull request is locked */
  locked: z.boolean(),
  /** Pull request title */
  title: z.string(),
  /** User who created the pull request */
  user: User,
  /** Pull request description body */
  body: z.string().nullable(),
  /** ISO 8601 timestamp when created */
  created_at: z.string(),
  /** ISO 8601 timestamp when last updated */
  updated_at: z.string(),
  /** ISO 8601 timestamp when closed (if closed) */
  closed_at: z.string().nullable(),
  /** ISO 8601 timestamp when merged (if merged) */
  merged_at: z.string().nullable(),
  /** SHA of the merge commit (if merged) */
  merge_commit_sha: z.string().nullable(),
  /** User assigned to review */
  assignee: User.nullable(),
  /** All users assigned to review */
  assignees: z.array(User),
  /** Users requested to review */
  requested_reviewers: z.array(User),
  /** Teams requested to review */
  requested_teams: z.array(z.any()),
  /** Labels applied to pull request */
  labels: z.array(z.object({
    id: z.number(),
    node_id: z.string(),
    url: z.string(),
    name: z.string(),
    color: z.string(),
    default: z.boolean(),
    description: z.string().nullable(),
  })),
  /** Associated milestone */
  milestone: z.any().nullable(),
  /** Whether this is a draft pull request */
  draft: z.boolean(),
  /** Source branch/fork information */
  head: GitRef,
  /** Target branch information */
  base: GitRef,
  /** Whether PR has been merged */
  merged: z.boolean().optional(),
  /** Whether PR is mergeable */
  mergeable: z.boolean().nullable().optional(),
  /** Whether PR is in a rebasing state */
  rebaseable: z.boolean().nullable().optional(),
  /** Merge state status */
  mergeable_state: z.string().optional(),
  /** User who merged the PR */
  merged_by: User.nullable().optional(),
  /** Number of comments */
  comments: z.number().optional(),
  /** Number of review comments */
  review_comments: z.number().optional(),
  /** Whether maintainer can modify */
  maintainer_can_modify: z.boolean().optional(),
  /** Number of commits */
  commits: z.number().optional(),
  /** Number of additions */
  additions: z.number().optional(),
  /** Number of deletions */
  deletions: z.number().optional(),
  /** Number of changed files */
  changed_files: z.number().optional(),
})

/**
 * Pull request webhook event payload
 * Triggered when a pull request is opened, closed, or changed
 */
export const PullRequestEvent = z.object({
  /**
   * Action that triggered the event
   * Common actions: opened, closed, reopened, synchronize, edited
   */
  action: z.enum([
    'opened',
    'edited',
    'closed',
    'assigned',
    'unassigned',
    'review_requested',
    'review_request_removed',
    'ready_for_review',
    'converted_to_draft',
    'labeled',
    'unlabeled',
    'synchronize',
    'auto_merge_enabled',
    'auto_merge_disabled',
    'locked',
    'unlocked',
    'reopened',
  ]),
  /** Pull request number (same as pull_request.number) */
  number: z.number(),
  /** Full pull request object */
  pull_request: PullRequest,
  /** Repository where event occurred */
  repository: Repository,
  /** User who triggered the event */
  sender: User,
  /** GitHub App installation (if applicable) */
  installation: z.any().optional(),
  /** Organization (if applicable) */
  organization: z.any().optional(),
})

/**
 * Push webhook event payload
 * Triggered when commits are pushed to a repository
 */
export const PushEvent = z.object({
  /** Git ref that was pushed (e.g., 'refs/heads/main') */
  ref: z.string(),
  /** Commit SHA before the push */
  before: z.string(),
  /** Commit SHA after the push */
  after: z.string(),
  /** Whether this created a new branch/tag */
  created: z.boolean(),
  /** Whether this deleted a branch/tag */
  deleted: z.boolean(),
  /** Whether this was a force push */
  forced: z.boolean(),
  /** Base ref for comparison */
  base_ref: z.string().nullable(),
  /** URL to compare changes */
  compare: z.string(),
  /** Array of commits in this push */
  commits: z.array(z.object({
    /** Commit SHA */
    id: z.string(),
    /** Tree SHA */
    tree_id: z.string(),
    /** Whether commit is distinct */
    distinct: z.boolean(),
    /** Commit message */
    message: z.string(),
    /** ISO 8601 timestamp */
    timestamp: z.string(),
    /** URL to view commit */
    url: z.string(),
    /** Commit author */
    author: z.object({
      name: z.string(),
      email: z.string(),
      username: z.string().optional(),
    }),
    /** Commit committer */
    committer: z.object({
      name: z.string(),
      email: z.string(),
      username: z.string().optional(),
    }),
    /** Files added in commit */
    added: z.array(z.string()),
    /** Files removed in commit */
    removed: z.array(z.string()),
    /** Files modified in commit */
    modified: z.array(z.string()),
  })),
  /** HEAD commit after push */
  head_commit: z.any().nullable(),
  /** Repository where push occurred */
  repository: Repository,
  /** User who pushed */
  pusher: z.object({
    name: z.string(),
    email: z.string(),
  }),
  /** User who triggered the event */
  sender: User,
})

/**
 * Workflow dispatch event payload
 * Triggered when a workflow is manually triggered
 */
export const WorkflowDispatchEvent = z.object({
  /** Input values provided to the workflow */
  inputs: z.record(z.string(), z.any()).optional(),
  /** Git ref where workflow was triggered */
  ref: z.string(),
  /** Repository where workflow was triggered */
  repository: Repository,
  /** User who triggered the workflow */
  sender: User,
  /** Workflow file name */
  workflow: z.string(),
})

/**
 * Release event payload
 * Triggered when a release is published, unpublished, created, edited, deleted, or prereleased
 */
export const ReleaseEvent = z.object({
  /** Action that triggered the event */
  action: z.enum(['published', 'unpublished', 'created', 'edited', 'deleted', 'prereleased', 'released']),
  /** Release information */
  release: z.object({
    /** Unique release ID */
    id: z.number(),
    /** Node ID for GraphQL */
    node_id: z.string(),
    /** Tag name for the release */
    tag_name: z.string(),
    /** Target commitish (branch/SHA) */
    target_commitish: z.string(),
    /** Release name */
    name: z.string().nullable(),
    /** Whether this is a draft release */
    draft: z.boolean(),
    /** Whether this is a prerelease */
    prerelease: z.boolean(),
    /** ISO 8601 timestamp when created */
    created_at: z.string(),
    /** ISO 8601 timestamp when published */
    published_at: z.string().nullable(),
    /** User who created the release */
    author: User,
    /** Release assets */
    assets: z.array(z.any()),
    /** Release description */
    body: z.string().nullable(),
  }),
  /** Repository where release was created */
  repository: Repository,
  /** User who triggered the event */
  sender: User,
})

/**
 * GitHub Actions context with pull_request event
 * Use this to ensure your step only runs on pull request events
 */
export const PullRequestContext = z.object({
  /** Will always be 'pull_request' */
  eventName: z.literal('pull_request'),
  /** Pull request event payload */
  payload: PullRequestEvent,
  /** Repository information */
  repo: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  /** Workflow information */
  workflow: z.string(),
  /** Job name */
  job: z.string(),
  /** Run ID */
  runId: z.number(),
  /** Run number */
  runNumber: z.number(),
  /** SHA that triggered the workflow */
  sha: z.string(),
  /** Ref that triggered the workflow */
  ref: z.string(),
  /** Actor who triggered the workflow */
  actor: z.string(),
})

/**
 * GitHub Actions context with push event
 * Use this to ensure your step only runs on push events
 */
export const PushContext = z.object({
  /** Will always be 'push' */
  eventName: z.literal('push'),
  /** Push event payload */
  payload: PushEvent,
  /** Repository information */
  repo: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  /** Workflow information */
  workflow: z.string(),
  /** Job name */
  job: z.string(),
  /** Run ID */
  runId: z.number(),
  /** Run number */
  runNumber: z.number(),
  /** SHA that triggered the workflow */
  sha: z.string(),
  /** Ref that triggered the workflow */
  ref: z.string(),
  /** Actor who triggered the workflow */
  actor: z.string(),
})

/**
 * GitHub Actions context with workflow_dispatch event
 * Use this to ensure your step only runs on manual workflow triggers
 */
export const WorkflowDispatchContext = z.object({
  /** Will always be 'workflow_dispatch' */
  eventName: z.literal('workflow_dispatch'),
  /** Workflow dispatch event payload */
  payload: WorkflowDispatchEvent,
  /** Repository information */
  repo: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  /** Workflow information */
  workflow: z.string(),
  /** Job name */
  job: z.string(),
  /** Run ID */
  runId: z.number(),
  /** Run number */
  runNumber: z.number(),
  /** SHA that triggered the workflow */
  sha: z.string(),
  /** Ref that triggered the workflow */
  ref: z.string(),
  /** Actor who triggered the workflow */
  actor: z.string(),
})

/**
 * GitHub Actions context with release event
 * Use this to ensure your step only runs on release events
 */
export const ReleaseContext = z.object({
  /** Will always be 'release' */
  eventName: z.literal('release'),
  /** Release event payload */
  payload: ReleaseEvent,
  /** Repository information */
  repo: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  /** Workflow information */
  workflow: z.string(),
  /** Job name */
  job: z.string(),
  /** Run ID */
  runId: z.number(),
  /** Run number */
  runNumber: z.number(),
  /** SHA that triggered the workflow */
  sha: z.string(),
  /** Ref that triggered the workflow */
  ref: z.string(),
  /** Actor who triggered the workflow */
  actor: z.string(),
})

/**
 * Generic GitHub Actions context that accepts any event type
 * Use this when your step needs to work with multiple event types
 */
export const GenericContext = z.object({
  /** Event name (e.g., 'push', 'pull_request', etc.) */
  eventName: z.string(),
  /** Event payload (structure depends on eventName) */
  payload: z.any(),
  /** Repository information */
  repo: z.object({
    owner: z.string(),
    repo: z.string(),
  }),
  /** Workflow information */
  workflow: z.string(),
  /** Job name */
  job: z.string(),
  /** Run ID */
  runId: z.number(),
  /** Run number */
  runNumber: z.number(),
  /** SHA that triggered the workflow */
  sha: z.string(),
  /** Ref that triggered the workflow */
  ref: z.string(),
  /** Actor who triggered the workflow */
  actor: z.string(),
})

/**
 * Helper to create a context schema for specific event types
 * @param eventName - The GitHub event name
 * @param payloadSchema - Zod schema for the event payload
 * @example
 * const MyCustomContext = createContextSchema('issues', IssuesEventSchema)
 */
export function createContextSchema<T extends z.ZodTypeAny>(
  eventName: string,
  payloadSchema: T,
) {
  return z.object({
    eventName: z.literal(eventName),
    payload: payloadSchema,
    repo: z.object({
      owner: z.string(),
      repo: z.string(),
    }),
    workflow: z.string(),
    job: z.string(),
    runId: z.number(),
    runNumber: z.number(),
    sha: z.string(),
    ref: z.string(),
    actor: z.string(),
  })
}
