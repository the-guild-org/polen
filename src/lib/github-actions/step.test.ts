import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod/v4'
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

  it('warns about excess properties in inputs', async () => {
    const TestStep = defineStep({
      name: 'test-step',
      description: 'Test step',
      inputs: z.object({
        required: z.string(),
        optional: z.string().optional(),
      }),
      outputs: z.object({ result: z.string() }),
      async execute({ inputs }) {
        return { result: `Got ${inputs.required}` }
      },
    })

    const result = await TestStep(mockContext, {
      required: 'value',
      optional: 'optional-value',
      unknown1: 'should-warn',
      unknown2: 'should-also-warn',
    })

    expect(result).toEqual({ result: 'Got value' })
    expect(mockCore.warning).toHaveBeenCalledWith(
      `Step 'test-step' received unknown inputs: unknown1, unknown2. These inputs will be ignored.`,
    )
    expect(mockCore.debug).toHaveBeenCalledWith('Known inputs: required, optional')
  })

  it('does not warn when no excess properties', async () => {
    const TestStep = defineStep({
      name: 'test-step',
      description: 'Test step',
      inputs: z.object({
        required: z.string(),
      }),
      outputs: z.object({ result: z.string() }),
      async execute({ inputs }) {
        return { result: inputs.required }
      },
    })

    await TestStep(mockContext, { required: 'value' })

    expect(mockCore.warning).not.toHaveBeenCalled()
  })

  it('validates input types', async () => {
    const TestStep = defineStep({
      name: 'test-step',
      description: 'Test step',
      inputs: z.object({
        number: z.number(),
      }),
      outputs: z.object({ result: z.string() }),
      async execute() {
        return { result: 'ok' }
      },
    })

    await expect(TestStep(mockContext, { number: 'not-a-number' })).rejects.toThrow()
    expect(mockCore.error).toHaveBeenCalledWith(
      expect.stringContaining('Validation error in step test-step'),
    )
  })

  it('does not warn for non-object schemas', async () => {
    const TestStep = defineStep({
      name: 'test-step',
      description: 'Test step',
      inputs: z.string(),
      outputs: z.object({ result: z.string() }),
      async execute({ inputs }) {
        return { result: inputs }
      },
    })

    await TestStep(mockContext, 'just-a-string')

    expect(mockCore.warning).not.toHaveBeenCalled()
  })
})
