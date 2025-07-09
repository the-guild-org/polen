import { AsyncLocalStorage } from 'node:async_hooks'
import type { Theme } from '../../lib/theme/theme.js'

export interface RequestContext {
  request: Request
  theme: Theme
}

export const requestAsyncContext = new AsyncLocalStorage<RequestContext>()

export function getRequestContext(): RequestContext {
  const context = requestAsyncContext.getStore()
  if (!context) {
    throw new Error(
      'Request context not available. Make sure you are calling this from within a server component during SSR.',
    )
  }
  return context
}

export function getTheme(): Theme {
  return getRequestContext().theme
}
