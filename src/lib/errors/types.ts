import type { ContextualError } from './ContextualError.ts'

export type Cause = Error | ContextualError
export type Context = object
