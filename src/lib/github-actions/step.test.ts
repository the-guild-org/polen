import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod/v4'
import { runStep } from './runner.ts'
import { defineStep } from './step.ts'

describe('defineWorkflowStep', () => {
  const mockCore = {
    startGroup: vi.fn(),
    endGroup: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    setOutput: vi.fn(),
  } as any

  const mockContext = {
    core: mockCore,
    github: {} as any,
    context: {} as any,
    $: {} as any,
    fs: {} as any,
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes step with validated inputs', async () => {
    const TestStep = defineStep({
      name: 'test-step',
      description: 'Test step',
      inputs: z.object({
        required: z.string(),
        optional: z.string().optional(),
      }),
      outputs: z.object({ result: z.string() }),
      async run({ inputs }) {
        return { result: `Got ${inputs.required}` }
      },
    })

    // Create context with PR controller
    const contextWithPR = {
      ...mockContext,
      pr: {
        number: 0,
        isActive: false,
        comment: vi.fn(),
        deleteComment: vi.fn(),
        getComments: vi.fn(),
      },
    }

    const result = await TestStep.run({
      ...contextWithPR,
      inputs: {
        required: 'value',
        optional: 'optional-value',
      },
    })

    expect(result).toEqual({ result: 'Got value' })
  })

  it('validates output types', async () => {
    const TestStep = defineStep({
      name: 'test-step',
      description: 'Test step',
      inputs: z.object({
        required: z.string(),
      }),
      outputs: z.object({ result: z.string() }),
      async run({ inputs }) {
        return { result: inputs.required }
      },
    })

    // Outputs are validated in the runner, not in execute
    expect(TestStep.definition.outputs).toBeDefined()
    expect(TestStep.definition.inputs).toBeDefined()
  })

  it('step definition contains all metadata', async () => {
    const TestStep = defineStep({
      name: 'test-step',
      description: 'Test step',
      inputs: z.object({
        number: z.number(),
      }),
      outputs: z.object({ result: z.string() }),
      async run() {
        return { result: 'ok' }
      },
    })

    expect(TestStep.definition.name).toBe('test-step')
    expect(TestStep.definition.description).toBe('Test step')
    expect(TestStep.definition.inputs).toBeDefined()
    expect(TestStep.definition.outputs).toBeDefined()
  })

  // todo: this test is now a static type error, update to refelct that
  // it('does not warn for non-object schemas', async () => {
  //   const TestStep = defineStep({
  //     name: 'test-step',
  //     description: 'Test step',
  //     inputs: z.string(),
  //     outputs: z.object({ result: z.string() }),
  //     async run({ inputs }) {
  //       return { result: inputs }
  //     },
  //   })

  //   await TestStep(mockContext, 'just-a-string')

  //   expect(mockCore.warning).not.toHaveBeenCalled()
  // })

  it('always provides PR controller', async () => {
    const mockPR = {
      number: 123,
      isActive: true,
      comment: vi.fn(),
      deleteComment: vi.fn(),
      getComments: vi.fn(),
    }

    const contextWithPR = {
      ...mockContext,
      pr: mockPR,
    }

    const TestStep = defineStep({
      name: 'test-step',
      description: 'Test step with PR',
      inputs: z.object({}),
      outputs: z.object({ isActive: z.boolean() }),
      async run({ pr }) {
        return { isActive: pr.isActive }
      },
    })

    const result = await TestStep.run({
      ...contextWithPR,
      inputs: {},
    })
    expect(result).toEqual({ isActive: true })
  })
})
