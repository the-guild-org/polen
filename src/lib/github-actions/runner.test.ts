import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod/v4'
import { runStep } from './runner.ts'
import { defineStep } from './step.ts'

// Mock the discovery module
vi.mock('./discovery.ts')

// Mock @actions/core
vi.mock('@actions/core', () => ({
  startGroup: vi.fn(),
  endGroup: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
}))

// Mock GitHub context
vi.mock('@actions/github', () => ({
  context: {
    repo: { owner: 'test', repo: 'test' },
    eventName: 'push',
    payload: {},
  },
  getOctokit: vi.fn(() => ({
    rest: {
      issues: {
        listComments: vi.fn().mockResolvedValue({ data: [] }),
        createComment: vi.fn(),
        updateComment: vi.fn(),
        deleteComment: vi.fn(),
      },
    },
  })),
}))

describe('runner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env['GITHUB_TOKEN'] = 'test-token'
  })

  describe('runStep', () => {
    it('validates inputs before running step', async () => {
      const TestStep = defineStep({
        name: 'test-step',
        description: 'Test step',
        inputs: z.object({
          required: z.string(),
          number: z.number(),
        }),
        outputs: z.object({ result: z.string() }),
        async run({ inputs }) {
          return { result: `Got ${inputs.required} and ${inputs.number}` }
        },
      })

      // Mock the module import
      vi.doMock('./test-step.ts', () => ({
        default: TestStep,
      }))

      await runStep(
        './test-step.ts',
        JSON.stringify({
          required: 'value',
          number: 42,
        }),
      )

      const core = await import('@actions/core')
      expect(core.startGroup).toHaveBeenCalledWith('test-step: Test step')
      expect(core.setOutput).toHaveBeenCalledWith('result', 'Got value and 42')
    })

    it('handles validation errors', async () => {
      const TestStep = defineStep({
        name: 'test-step',
        description: 'Test step',
        inputs: z.object({
          required: z.string(),
          number: z.number(),
        }),
        outputs: z.object({ result: z.string() }),
        async run() {
          return { result: 'ok' }
        },
      })

      vi.doMock('./test-step.ts', () => ({
        default: TestStep,
      }))

      const core = await import('@actions/core')

      await expect(runStep(
        './test-step.ts',
        JSON.stringify({
          required: 'value',
          number: 'not-a-number', // Invalid type
        }),
      )).rejects.toThrow()

      expect(core.error).toHaveBeenCalledWith(
        expect.stringContaining('Validation error in step test-step'),
      )
    })

    it('warns about unknown inputs', async () => {
      const TestStep = defineStep({
        name: 'test-step',
        description: 'Test step',
        inputs: z.object({
          known: z.string(),
        }),
        outputs: z.object({ result: z.string() }),
        async run({ inputs }) {
          return { result: inputs.known }
        },
      })

      vi.doMock('./test-step.ts', () => ({
        default: TestStep,
      }))

      await runStep(
        './test-step.ts',
        JSON.stringify({
          known: 'value',
          unknown1: 'should-warn',
          unknown2: 'also-warn',
        }),
      )

      const core = await import('@actions/core')
      expect(core.warning).toHaveBeenCalledWith(
        `Step 'test-step' received unknown inputs: unknown1, unknown2. These inputs will be ignored.`,
      )
    })

    it('validates and exports outputs', async () => {
      const TestStep = defineStep({
        name: 'test-step',
        description: 'Test step',
        inputs: z.object({}),
        outputs: z.object({
          status: z.string(),
          count: z.number(),
        }),
        async run() {
          return { status: 'complete', count: 5 }
        },
      })

      vi.doMock('./test-step.ts', () => ({
        default: TestStep,
      }))

      await runStep('./test-step.ts', '{}')

      const core = await import('@actions/core')
      expect(core.setOutput).toHaveBeenCalledWith('status', 'complete')
      expect(core.setOutput).toHaveBeenCalledWith('count', '5')
    })

    it('warns when step returns outputs without schema', async () => {
      const TestStep = defineStep({
        name: 'test-step',
        description: 'Test step',
        inputs: z.object({}),
        // No outputs schema defined
        async run() {
          return { unexpected: 'output' } as any
        },
      })

      vi.doMock('./test-step.ts', () => ({
        default: TestStep,
      }))

      await runStep('./test-step.ts', '{}')

      const core = await import('@actions/core')
      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining('Step did not define outputs schema, but returned outputs'),
      )
    })
  })
})
