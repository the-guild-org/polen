/**
 * Default Polen global data structure
 * This ensures we always have a consistent shape for hydration
 */
export const DEFAULT_POLEN_DATA = {
  serverContext: {
    theme: 'light' as const,
    isDev: false,
  },
} as const

export type PolenGlobalData = {
  serverContext: {
    theme: 'light' | 'dark' | 'system'
    isDev: boolean
  }
}
