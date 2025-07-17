import { proxy } from 'valtio'

/**
 * Toast notification types
 */
export const Type = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const

export type Type = typeof Type[keyof typeof Type]

/**
 * Toast notification interface
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string
  /** Primary message text */
  message: string
  /** Optional secondary description text */
  description?: string
  /** Visual type/variant of the toast */
  type?: Type
  /** Duration in milliseconds before auto-dismiss. Set to 0 to disable auto-dismiss */
  duration?: number
  /** Optional action buttons configuration */
  actions: {
    /** Action button label */
    label: string
    /** Action button click handler */
    onClick: () => void
  }[]
}

/**
 * Toast store state interface
 */
export interface State {
  /** Array of active toast notifications */
  toasts: Toast[]
}

/**
 * Initial state for the toast store
 */
export const initialState: State = {
  toasts: [],
}

/**
 * Default values for toast properties
 */
const toastDefaults = {
  duration: 5000,
  actions: [],
} satisfies Partial<Toast>

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
      setTimeout(() => store.remove(id), toast.duration || toastDefaults.duration)
    }

    return id
  },

  /**
   * Remove a toast by ID
   * @param id - Toast ID to remove
   */
  remove(id: string): void {
    const index = store.toasts.findIndex(t => t.id === id)
    if (index > -1) {
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
    return store.add({ ...toastDefaults, ...options, message, type: Type.info })
  },

  /**
   * Show a success toast
   * @param message - Toast message
   * @param options - Additional toast options
   * @returns Generated toast ID
   */
  success(message: string, options?: InputOptions) {
    return store.add({ ...toastDefaults, ...options, message, type: Type.success })
  },

  /**
   * Show a warning toast
   * @param message - Toast message
   * @param options - Additional toast options
   * @returns Generated toast ID
   */
  warning(message: string, options?: InputOptions) {
    return store.add({ ...toastDefaults, ...options, message, type: Type.warning })
  },

  /**
   * Show an error toast
   * @param message - Toast message
   * @param options - Additional toast options
   * @returns Generated toast ID
   */
  error(message: string, options?: InputOptions) {
    return store.add({ ...toastDefaults, ...options, message, type: Type.error })
  },
})

type InputOptions = Partial<Omit<Toast, 'id' | 'message' | 'type'>>
