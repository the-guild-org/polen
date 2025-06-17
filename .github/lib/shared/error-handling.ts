/**
 * Standardized error handling for GitHub Actions workflows
 */

export class WorkflowError extends Error {
  constructor(
    public readonly step: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(`[${step}] ${message}`)
    this.name = 'WorkflowError'
    
    if (cause instanceof Error) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`
    }
  }

  static wrap(step: string, error: unknown): WorkflowError {
    if (error instanceof WorkflowError) {
      return error
    }
    
    const message = error instanceof Error ? error.message : String(error)
    return new WorkflowError(step, message, error)
  }
}

export class ValidationError extends WorkflowError {
  constructor(step: string, field: string, value: unknown, expected: string) {
    super(step, `Invalid ${field}: expected ${expected}, got ${JSON.stringify(value)}`)
    this.name = 'ValidationError'
  }
}

export class ConfigurationError extends WorkflowError {
  constructor(step: string, message: string) {
    super(step, `Configuration error: ${message}`)
    this.name = 'ConfigurationError'
  }
}

/**
 * Utility for safely executing async operations with proper error handling
 */
export async function safeExecute<T>(
  step: string,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw WorkflowError.wrap(step, error)
  }
}

/**
 * Utility for safely executing operations that may partially fail
 */
export async function executeWithContinuation<T, R>(
  step: string,
  items: T[],
  operation: (item: T) => Promise<R>,
): Promise<{ successes: R[]; failures: Array<{ item: T; error: WorkflowError }> }> {
  const successes: R[] = []
  const failures: Array<{ item: T; error: WorkflowError }> = []

  for (const item of items) {
    try {
      const result = await operation(item)
      successes.push(result)
    } catch (error) {
      failures.push({
        item,
        error: WorkflowError.wrap(step, error),
      })
    }
  }

  return { successes, failures }
}