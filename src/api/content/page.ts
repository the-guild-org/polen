import type { FileRouter } from '#lib/file-router/index'
import type { Metadata } from './metadata.ts'

export type { Metadata }

/**
 * A route with its associated metadata
 */
export interface Page {
  route: FileRouter.Route
  metadata: Metadata
}
