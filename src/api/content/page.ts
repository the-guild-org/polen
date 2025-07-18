import type { FileRouter } from '#lib/file-router'
import type { Metadata } from './metadata.js'

export type { Metadata }

/**
 * A route with its associated metadata
 */
export interface Page {
  route: FileRouter.Route
  metadata: Metadata
}
