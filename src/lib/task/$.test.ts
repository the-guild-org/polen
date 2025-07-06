import * as fc from 'fast-check'
import { describe, expect, test, vi } from 'vitest'
import { Task } from './$.js'

describe('create', () => {
  test('executes async function and captures timing', async () => {
    const double = Task.create(
      async (x: number) => x * 2,
      { name: 'double' },
    )

    const report = await double(5)

    expect(report.task.name).toBe('double')
    expect(report.execution.input).toBe(5)
    expect(report.execution.output).toBe(10)
    expect(report.execution.timings.duration).toBeGreaterThan(0)
  })

  test('captures errors', async () => {
    const failing = Task.create(
      async () => {
        throw new Error('Failed')
      },
      { name: 'failing' },
    )

    const report = await failing(null)

    expect(report.execution.output).toBeInstanceOf(Error)
    expect(report.execution.output.message).toBe('Failed')
  })
})

describe('formatReport', () => {
  test('masks sensitive data', async () => {
    const createUser = Task.create(
      async (data: any) => ({
        email: data.email,
        token: 'abc123',
      }),
      {
        name: 'create-user',
        mask: {
          input: { password: false }, // Hide password
          output: { token: false }, // Hide token
        },
      },
    )

    const report = await createUser({
      email: 'user@example.com',
      password: 'secret',
    })

    // Uses mask from task definition by default
    const formatted = Task.formatReport(report)

    expect(formatted).toContain('create-user')
    expect(formatted).toContain('user@example.com')
    expect(formatted).not.toContain('secret')
    expect(formatted).not.toContain('abc123')
  })

  test('debug mode reveals all data', async () => {
    const createUser = Task.create(
      async (data: any) => ({
        email: data.email,
        token: 'abc123',
      }),
      {
        name: 'create-user',
        mask: {
          input: { password: false }, // Hide password
          output: { token: false }, // Hide token
        },
      },
    )

    const report = await createUser({
      email: 'user@example.com',
      password: 'secret',
    })

    const formatted = Task.formatReport(report, { debug: true })

    expect(formatted).toContain('secret')
    expect(formatted).toContain('abc123')
  })
})

describe('exitWithReport', () => {
  test('exits with code 0 on success', async () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {})

    const success = Task.create(async () => 'result')
    const report = await success(null)

    expect(() => Task.exitWithReport(report)).toThrow('process.exit called')
    expect(mockExit).toHaveBeenCalledWith(0)
    expect(mockLog).toHaveBeenCalled()

    mockExit.mockRestore()
    mockLog.mockRestore()
  })

  test('exits with code 1 on error', async () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {})

    const failing = Task.create(async () => {
      throw new Error('Failed')
    })
    const report = await failing(null)

    expect(() => Task.exitWithReport(report)).toThrow('process.exit called')
    expect(mockExit).toHaveBeenCalledWith(1)
    expect(mockLog).toHaveBeenCalled()

    mockExit.mockRestore()
    mockLog.mockRestore()
  })
})

describe('runAndExit', () => {
  test('combines create, execute, and exit into one call', async () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {})

    const double = async (x: number) => x * 2

    await expect(() => Task.runAndExit(double, 5, { name: 'double' })).rejects.toThrow('process.exit called')

    expect(mockExit).toHaveBeenCalledWith(0)
    expect(mockLog).toHaveBeenCalled()

    // Verify the logged output contains expected content
    const loggedOutput = mockLog.mock.calls[0]?.[0]
    expect(loggedOutput).toContain('double')
    expect(loggedOutput).toContain('10') // Result of 5 * 2

    mockExit.mockRestore()
    mockLog.mockRestore()
  })

  test('exits with error code on failure', async () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {})

    const failing = async () => {
      throw new Error('Task failed')
    }

    await expect(() => Task.runAndExit(failing, null, { name: 'failing' })).rejects.toThrow('process.exit called')

    expect(mockExit).toHaveBeenCalledWith(1)
    expect(mockLog).toHaveBeenCalled()

    mockExit.mockRestore()
    mockLog.mockRestore()
  })
})

describe('property-based tests', () => {
  test('duration is always positive', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer(),
        async (input) => {
          const identity = Task.create(
            async (x: any) => x,
            { name: 'identity' },
          )

          const report = await identity(input)

          expect(report.execution.timings.duration).toBeGreaterThanOrEqual(0)
          expect(report.execution.output).toBe(input)
        },
      ),
    )
  })

  test('timing fields are consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.anything(),
        async (input) => {
          const noop = Task.create(async (_: any) => null)
          const report = await noop(input)

          const { start, end, duration } = report.execution.timings

          expect(end).toBeGreaterThanOrEqual(start)
          expect(duration).toBeCloseTo(end - start, 5)
        },
      ),
    )
  })
})
