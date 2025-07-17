import { Stores } from '../stores/$.js'

/**
 * Execute an async function with automatic error handling and toast notifications
 *
 * @param fn - Async function to execute
 * @param errorMessage - Optional custom error message for the toast (defaults to error message)
 * @returns Promise that resolves to null on success or Error on failure
 */
export const tryWithToast = async <T>(
  fn: () => Promise<T>,
  errorMessage?: string,
): Promise<Error | null> => {
  try {
    await fn()
    return null
  } catch (error) {
    // Log to console in all environments
    console.error('Error in tryWithToast:', error)

    // Determine the error message
    const baseMessage = error instanceof Error ? error.message : String(error)
    const toastMessage = errorMessage || baseMessage

    // In development, show detailed error info
    if (import.meta.env.DEV) {
      Stores.Toast.store.error(toastMessage, {
        description: error instanceof Error
          ? `${error.name}: ${error.message}${error.stack ? '\n\nStack trace available in console.' : ''}`
          : `Error details: ${String(error)}`,
        duration: 10000, // Longer duration in dev for debugging
      })
    } else {
      // In production, show simplified message
      Stores.Toast.store.error(toastMessage)
    }

    // Return the error for downstream fallback logic
    return error instanceof Error ? error : new Error(baseMessage)
  }
}
