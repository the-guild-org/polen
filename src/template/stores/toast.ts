import { Duration, Schema as S } from 'effect'
import { proxy } from 'valtio'

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Toast notification types schema
 */
export const Type = S.Enums(
  {
    Info: 'info',
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  } as const,
)
export type Type = typeof Type.Type

/**
 * Toast action schema
 */
export const ToastAction = S.Struct({
  /** Action button label */
  label: S.String,
  /** Action button click handler */
  onClick: S.Any, // Functions can't be validated
})

export type ToastAction = typeof ToastAction.Type

/**
 * Toast notification schema
 */
export const Toast = S.Struct({
  /** Unique identifier for the toast */
  id: S.String,
  /** Primary message text */
  message: S.String,
  /** Optional secondary description text */
  description: S.optional(S.String),
  /** Visual type/variant of the toast */
  type: S.optional(Type),
  /** Duration in milliseconds before auto-dismiss. Set to 0 to disable auto-dismiss */
  duration: S.optional(S.Number),
  /** Optional action buttons configuration */
  actions: S.Array(ToastAction),
})

export type Toast = typeof Toast.Type

/**
 * Toast store state
 */
export const State = S.Struct({
  /** Array of active toast notifications */
  toasts: S.mutable(S.Array(Toast)),
})

export type State = typeof State.Type

// ============================================================================
// Initial State & Defaults
// ============================================================================

export const initialState: State = {
  toasts: [],
}

const DEFAULT_TOAST_DURATION = Duration.seconds(5)

const toastDefaults = {
  duration: Duration.toMillis(DEFAULT_TOAST_DURATION),
  actions: [],
} satisfies Partial<Toast>

// ============================================================================
// Store
// ============================================================================

/**
 * Toast notification store
 *
 * Manages toast notifications with auto-dismiss functionality and type-specific convenience methods.
 */
export const store = proxy({
  ...initialState,

  /**
   * Add a new toast notification
   * @param toast - Toast configuration (id will be auto-generated)
   * @returns Generated toast ID
   */
  add(toast: Omit<Toast, 'id'>): string {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    store.toasts.push({ ...toast, id })

    // Auto-remove after duration (default 5 seconds). Set duration to 0 to disable auto-dismiss
    if (toast.duration !== 0) {
      const durationMs = toast.duration || toastDefaults.duration
      setTimeout(() => store.remove(id), durationMs)
    }

    return id
  },

  /**
   * Remove a toast by ID
   * @param id - Toast ID to remove
   */
  remove(id: string): void {
    const index = store.toasts.findIndex(t => t.id === id)
    if (index !== -1) {
      store.toasts.splice(index, 1)
    }
  },

  /**
   * Reset store to initial state
   */
  reset() {
    Object.assign(store, initialState)
  },

  /**
   * Set store state
   * @param data - New state data
   */
  set(data: State) {
    Object.assign(store, data)
  },

  /**
   * Show an info toast
   * @param message - Toast message
   * @param options - Additional toast options
   * @returns Generated toast ID
   */
  info(message: string, options?: InputOptions) {
    return store.add({ ...toastDefaults, ...options, message, type: Type.enums.Info })
  },

  /**
   * Show a success toast
   * @param message - Toast message
   * @param options - Additional toast options
   * @returns Generated toast ID
   */
  success(message: string, options?: InputOptions) {
    return store.add({ ...toastDefaults, ...options, message, type: Type.enums.Success })
  },

  /**
   * Show a warning toast
   * @param message - Toast message
   * @param options - Additional toast options
   * @returns Generated toast ID
   */
  warning(message: string, options?: InputOptions) {
    return store.add({ ...toastDefaults, ...options, message, type: Type.enums.Warning })
  },

  /**
   * Show an error toast
   * @param message - Toast message
   * @param options - Additional toast options
   * @returns Generated toast ID
   */
  error(message: string, options?: InputOptions) {
    return store.add({ ...toastDefaults, ...options, message, type: Type.enums.Error })
  },
})

type InputOptions = Partial<Omit<Toast, 'id' | 'message' | 'type'>>
