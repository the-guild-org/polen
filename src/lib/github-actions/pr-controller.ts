import type { Context } from '@actions/github/lib/context.ts'
import type { GitHub } from '@actions/github/lib/utils.ts'
import { type Deployment, fetchPullRequestDeployments } from './lib/get-pr-deployments.ts'

const createCommentMarker = (id: string) => `<!-- comment-id: ${id} -->`

export interface CommentOptions {
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

/**
 * Create a PR controller. Returns a no-op controller when not in PR context.
 */
export function createPullRequestController(
  github: InstanceType<typeof GitHub>,
  context: Context,
  defaultCommentId?: string,
): PullRequestController {
  // Check if this is a PR-related event
  let prNumber: number | null = null

  if (context.payload.pull_request?.number) {
    // Direct PR events
    prNumber = context.payload.pull_request.number
  } else if (context.eventName === 'issue_comment' && context.payload.issue?.['pull_request']) {
    // Issue comment on a PR (not on a regular issue)
    prNumber = context.payload.issue.number
  }

  return new PullRequestController(github, context, prNumber, defaultCommentId)
}

// /**
//  * Check if the current event is PR-related
//  */
// function isPREvent(context: Context): boolean {
//   const prEvents = [
//     'pull_request',
//     'pull_request_review',
//     'pull_request_review_comment',
//     'pull_request_target',
//     'issue_comment', // Can be on PRs too
//   ]

//   return prEvents.includes(context.eventName)
//     || (context.eventName === 'issue_comment' && context.payload.issue?.['pull_request'])
// }

/**
 * PR Controller for GitHub Actions
 * Provides easy-to-use methods for interacting with pull requests
 */
export class PullRequestController {
  public readonly isActive = true

  constructor(
    private github: InstanceType<typeof GitHub>,
    private context: Context,
    public number: number | null,
    private defaultCommentId?: string,
  ) {}

  async comment(options: CommentOptions): Promise<void> {
    if (!this.number) {
      console.log(`Skipping PR comment: not in a PR context`)
      return
    }

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

  async fetchDeployments(): Promise<Deployment[]> {
    if (!this.number) {
      console.log(`Skipping fetchPullRequestDeployments: not in a PR context`)
      return []
    }
    return await fetchPullRequestDeployments(
      this.github,
      this.context.repo.repo,
      this.context.repo.owner,
      this.number,
    )
  }

  async deleteComment(id: string): Promise<void> {
    if (!this.number) {
      console.log('Skipping deleteComment: not in a PR context')
      return
    }
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

  // async getComments(): Promise<Array<{ id: number; body: string; created_at: string }>> {
  //   const { owner, repo } = this.context.repo

  //   const { data: comments } = await this.github.rest.issues.listComments({
  //     owner,
  //     repo,
  //     issue_number: this.number,
  //     per_page: 100,
  //   })

  //   return comments.map(comment => ({
  //     id: comment.id,
  //     body: comment.body || '',
  //     created_at: comment.created_at,
  //   }))
  // }
}
