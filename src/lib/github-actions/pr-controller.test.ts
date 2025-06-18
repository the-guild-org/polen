import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPRController } from './pr-controller.ts'

describe('createPRController', () => {
  const mockGitHub = {
    rest: {
      issues: {
        listComments: vi.fn(),
        createComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      },
    },
  } as any

  const mockContext = {
    eventName: 'pull_request',
    repo: {
      owner: 'test-owner',
      repo: 'test-repo',
    },
    payload: {
      pull_request: {
        number: 123,
      },
    },
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns no-op controller for non-PR events', () => {
    const nonPRContext = {
      ...mockContext,
      eventName: 'push',
      payload: {},
    }

    const controller = createPRController(mockGitHub, nonPRContext)
    expect(controller).toBeDefined()
    expect(controller.isActive).toBe(false)
    expect(controller.number).toBe(0)
  })

  it('returns active PR controller for PR events', () => {
    const controller = createPRController(mockGitHub, mockContext)
    expect(controller).toBeDefined()
    expect(controller.isActive).toBe(true)
    expect(controller.number).toBe(123)
  })

  describe('PR controller methods', () => {
    it('creates new comment when none exists', async () => {
      mockGitHub.rest.issues.listComments.mockResolvedValue({ data: [] })

      const controller = createPRController(mockGitHub, mockContext)!
      await controller.comment({ id: 'test', content: 'Hello world' })

      expect(mockGitHub.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123,
        body: 'Hello world\n\n<!-- comment-id: test -->',
      })
    })

    it('uses default comment ID when not provided', async () => {
      mockGitHub.rest.issues.listComments.mockResolvedValue({ data: [] })

      const controller = createPRController(mockGitHub, mockContext, 'pr-comment')!
      await controller.comment({ content: 'Hello world' })

      expect(mockGitHub.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123,
        body: 'Hello world\n\n<!-- comment-id: pr-comment -->',
      })
    })

    it('updates existing comment', async () => {
      mockGitHub.rest.issues.listComments.mockResolvedValue({
        data: [
          {
            id: 456,
            body: 'Old content\n\n<!-- comment-id: test -->',
          },
        ],
      })

      const controller = createPRController(mockGitHub, mockContext)!
      await controller.comment({ id: 'test', content: 'New content' })

      expect(mockGitHub.rest.issues.updateComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        comment_id: 456,
        body: 'New content\n\n<!-- comment-id: test -->',
      })
    })

    it('deletes comment by ID', async () => {
      mockGitHub.rest.issues.listComments.mockResolvedValue({
        data: [
          {
            id: 456,
            body: 'Content\n\n<!-- comment-id: test -->',
          },
        ],
      })

      const controller = createPRController(mockGitHub, mockContext)!
      await controller.deleteComment('test')

      expect(mockGitHub.rest.issues.deleteComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        comment_id: 456,
      })
    })

    it('handles issue_comment events on PRs', () => {
      const issueCommentContext = {
        ...mockContext,
        eventName: 'issue_comment',
        payload: {
          issue: {
            number: 789,
            pull_request: {}, // Presence indicates it's a PR
          },
        },
      }

      const controller = createPRController(mockGitHub, issueCommentContext)
      expect(controller).toBeDefined()
      expect(controller.number).toBe(789)
    })
  })

  describe('No-op PR controller', () => {
    it('throws error for non-optional comments', async () => {
      const nonPRContext = {
        ...mockContext,
        eventName: 'push',
        payload: {},
      }

      const controller = createPRController(mockGitHub, nonPRContext)

      await expect(controller.comment({ content: 'Test' })).rejects.toThrow(
        'Not in a PR context, cannot create comment',
      )
    })

    it('logs and continues for optional comments', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const nonPRContext = {
        ...mockContext,
        eventName: 'push',
        payload: {},
      }

      const controller = createPRController(mockGitHub, nonPRContext)

      await expect(controller.comment({ content: 'Test', optional: true })).resolves.not.toThrow()
      expect(consoleLogSpy).toHaveBeenCalledWith('[skip] Not in a PR context, cannot create comment')

      consoleLogSpy.mockRestore()
    })
  })
})
