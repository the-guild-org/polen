import { Either, Schema as S } from 'effect'
import { Nodes } from '../nodes/$.js'
import type { Path } from '../path.js'
import type { TargetSpec } from './define.js'
import * as TraversalError from './error.js'
import type { TraversalLocation } from './traversal-location.js'

/**
 * Core failure types for path traversal steps.
 * These are returned by adaptors when traversal fails.
 * The framework uses introspection to enrich these with details.
 */

// ============================================================================
// Step Failure Schemas
// ============================================================================

/**
 * The requested node could not be found.
 */
export const NodeNotFound = S.TaggedStruct('NodeNotFound', {})

/**
 * The target node's kind doesn't match what's required for this traversal.
 */
export const KindMismatch = S.TaggedStruct('KindMismatch', {})

/**
 * Union of all step failures.
 */
export const StepFailure = S.Union(NodeNotFound, KindMismatch)

// ============================================================================
// Types
// ============================================================================

export type NodeNotFound = typeof NodeNotFound.Type
export type KindMismatch = typeof KindMismatch.Type
export type StepFailure = typeof StepFailure.Type

// ============================================================================
// Constructors
// ============================================================================

export namespace StepFailures {
  export const NodeNotFound = (input: {} = {}) => ({ _tag: 'NodeNotFound' as const, ...input })
  export const KindMismatch = (input: {} = {}) => ({ _tag: 'KindMismatch' as const, ...input })
}

// ============================================================================
// Guard Failure
// ============================================================================

export const GuardFailure = S.TaggedStruct('KindMismatch', {})
export type GuardFailure = typeof GuardFailure.Type

// ============================================================================
// Stepper Interface
// ============================================================================

export interface Stepper {
  guard?: (targetNode: any) => Either.Either<any, GuardFailure>
  step: (params: any) => Either.Either<any, StepFailure>
}

export type GetStepperInputTargetNode<
  $TargetSpec extends TargetSpec,
  $Tag extends Nodes.$Types.Tag,
> = NonNullable<$TargetSpec['nodes'][Nodes.$Types.GetParentTags<$Tag> & keyof $TargetSpec['nodes']]>

// ============================================================================
// Traversal State
// ============================================================================

export interface TraversalState {
  path: Path
  parentChain: Nodes.$Groups.$Any[]
  position: number
  currentPathNode: Nodes.$Groups.$Any | undefined
  targetParentNode: any
  context: any
  options: any | undefined
}

// ============================================================================
// Stepper Execution
// ============================================================================

export const runStepper = (
  stepper: Stepper,
  state: TraversalState,
): Either.Either<any, StepFailure | TraversalError.TraversalError> => {
  // Check if this node's parent is Root (unmapped)
  const isRootChild = state.parentChain.length === 0

  if (isRootChild) {
    // Root-child nodes only get pathNode and context
    return stepper.step({
      pathNode: state.currentPathNode,
      context: state.context,
    })
  }

  // Handle guard if present for non-root-child nodes
  let effectiveTargetNode = state.targetParentNode

  if (stepper.guard) {
    const guardResult = stepper.guard(state.targetParentNode)

    if (Either.isLeft(guardResult)) {
      // Guard failed
      const location: TraversalLocation = {
        currentNode: state.currentPathNode!,
        parentChain: [...state.parentChain],
        position: state.position,
      }

      // For KindMismatch, we can provide node kind information
      let nodeKind: string | undefined
      if (state.options?.introspection) {
        nodeKind = state.options.introspection.getKind?.({
          node: state.targetParentNode,
          context: state.context,
        })
      }

      return Either.left(
        new TraversalError.TraversalError({
          path: state.path,
          location,
          cause: guardResult.left as StepFailure, // GuardFailure has same shape as KindMismatch
          // Could add nodeKind here if TraversalError supported it
        }),
      )
    }

    // Guard passed - use narrowed value
    effectiveTargetNode = guardResult.right
  }

  // Execute the step with target node
  return stepper.step({
    pathNode: state.currentPathNode,
    targetNode: effectiveTargetNode,
    context: state.context,
  })
}
