import type { Nodes } from '../nodes/$.js'

/**
 * Represents a location during path traversal.
 * Tracks the current position and parent chain.
 */
export interface TraversalLocation {
  /**
   * The current node being processed.
   */
  currentNode: Nodes.$Groups.$Any

  /**
   * Chain of parent nodes from root to current (excluding current).
   */
  parentChain: readonly Nodes.$Groups.$Any[]

  /**
   * Position in the path (0-based index).
   */
  position: number
}
