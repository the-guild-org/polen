/**
 * PR Controller for GitHub Actions
 * Provides easy-to-use methods for interacting with pull requests
 */

import type { Context } from '@actions/github/lib/context.ts'
import type { GitHub } from '@actions/github/lib/utils.ts'

const createCommentMarker = (id: string) => `<!-- comment-id: ${id} -->`

export interface PRCommentOptions {
  /**
   * Unique identifier for the comment. Used to find and update existing comments.
   * If not provided, uses the current step name as the ID.
   */
  id?: string
  /**
   * Markdown content of the comment
   */
  content: string
  /**
   * Whether this comment is optional. If true, errors are logged but not thrown
   * when not in a PR context. Defaults to false.
   */
  optional?: boolean
}

export interface PRController {
  /**
   * The PR number (0 when not in PR context)
   */
  number: number

  /**
   * Whether this controller is active (in a PR context)
   */
  isActive: boolean

  /**
   * Create or update a comment on the PR
   */
  comment(options: PRCommentOptions): Promise<void>

  /**
   * Delete a comment by ID
   */
  deleteComment(id: string): Promise<void>

  /**
   * Get all comments on the PR
   */
  getComments(): Promise<Array<{ id: number; body: string; created_at: string }>>
}

/**
 * Create a PR controller. Returns a no-op controller when not in PR context.
 */
export function createPRController(
  github: InstanceType<typeof GitHub>,
  context: Context,
  defaultCommentId?: string,
): PRController {
  // Check if this is a PR-related event
  const prNumber = context.payload.pull_request?.number || context.payload.issue?.number

  if (!prNumber || !isPREvent(context)) {
    return new NoOpPRController(defaultCommentId)
  }

  return new PullRequestController(github, context, prNumber, defaultCommentId)
}

/**
 * Check if the current event is PR-related
 */
function isPREvent(context: Context): boolean {
  const prEvents = [
    'pull_request',
    'pull_request_review',
    'pull_request_review_comment',
    'pull_request_target',
    'issue_comment', // Can be on PRs too
  ]

  return prEvents.includes(context.eventName)
    || (context.eventName === 'issue_comment' && context.payload.issue?.['pull_request'])
}

class PullRequestController implements PRController {
  public readonly isActive = true

  constructor(
    private github: InstanceType<typeof GitHub>,
    private context: Context,
    public number: number,
    private defaultCommentId?: string,
  ) {}

  async comment(options: PRCommentOptions): Promise<void> {
    const { owner, repo } = this.context.repo

    // Use provided ID or fall back to default
    const commentId = options.id || this.defaultCommentId || 'default'

    // Search for existing comment with the ID in the body
    const commentMarker = createCommentMarker(commentId)
    const body = `${options.content}\n\n${commentMarker}`

    // Find existing comment
    const { data: comments } = await this.github.rest.issues.listComments({
      owner,
      repo,
      issue_number: this.number,
      per_page: 100,
    })

    const existingComment = comments.find(comment => comment.body?.includes(commentMarker))

    if (existingComment) {
      // Update existing comment
      await this.github.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body,
      })
    } else {
      // Create new comment
      await this.github.rest.issues.createComment({
        owner,
        repo,
        issue_number: this.number,
        body,
      })
    }
  }

  async deleteComment(id: string): Promise<void> {
    const { owner, repo } = this.context.repo
    const commentMarker = createCommentMarker(id)

    // Find existing comment
    const { data: comments } = await this.github.rest.issues.listComments({
      owner,
      repo,
      issue_number: this.number,
      per_page: 100,
    })

    const existingComment = comments.find(comment => comment.body?.includes(commentMarker))

    if (existingComment) {
      await this.github.rest.issues.deleteComment({
        owner,
        repo,
        comment_id: existingComment.id,
      })
    }
  }

  async getComments(): Promise<Array<{ id: number; body: string; created_at: string }>> {
    const { owner, repo } = this.context.repo

    const { data: comments } = await this.github.rest.issues.listComments({
      owner,
      repo,
      issue_number: this.number,
      per_page: 100,
    })

    return comments.map(comment => ({
      id: comment.id,
      body: comment.body || '',
      created_at: comment.created_at,
    }))
  }
}

/**
 * No-op PR controller for non-PR contexts
 */
class NoOpPRController implements PRController {
  public readonly number = 0
  public readonly isActive = false

  constructor(private defaultCommentId?: string) {}

  async comment(options: PRCommentOptions): Promise<void> {
    const optional = options.optional ?? false
    const message = `Not in a PR context, cannot create comment${options.id ? ` with ID '${options.id}'` : ''}`

    if (optional) {
      // Use console.log instead of core.info since we don't have access to core here
      console.log(`[skip] ${message}`)
    } else {
      throw new Error(message)
    }
  }

  async deleteComment(id: string): Promise<void> {
    throw new Error(`Not in a PR context, cannot delete comment with ID '${id}'`)
  }

  async getComments(): Promise<Array<{ id: number; body: string; created_at: string }>> {
    return []
  }
}
