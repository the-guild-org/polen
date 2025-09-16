import { EffectKit } from '#lib/kit-temp'
import { Either } from 'effect'
import type { Simplify } from 'type-fest'
import { Nodes } from '../nodes/$.js'
import type { Path } from '../path.js'
import * as TraversalError from './error.js'
import * as Stepper from './stepper.js'
import type { TraversalLocation } from './traversal-location.js'

// Re-export needed types
export type { GetStepperInputTargetNode } from './stepper.js'

export type Resolve<
  $TargetSpec extends TargetSpec,
> = (path: Path) => Either.Either<
  $TargetSpec['nodes'][keyof $TargetSpec['nodes']],
  TraversalError.TraversalError
>

// ============================================================================
// TargetSpec
// ============================================================================

export interface TargetSpec {
  context?: object
  nodes: {
    [_ in Nodes.$Types.Tag]?: object
  }
}

// ============================================================================
// Introspection
// ============================================================================

export type GetTargetNodes<$TargetSpec extends TargetSpec> = Simplify<$TargetSpec['nodes'][keyof $TargetSpec['nodes']]>

export interface Introspection<$TargetSpec extends TargetSpec> {
  getKind?: (params: {
    node: GetTargetNodes<$TargetSpec>
    context: $TargetSpec['context']
  }) => string | undefined

  getName?: (params: {
    node: GetTargetNodes<$TargetSpec>
    context: $TargetSpec['context']
  }) => string | undefined

  // Specialized introspectors for different failure contexts
  getTypes?: (params: {
    context: $TargetSpec['context']
  }) => string[] | undefined

  getFields?: (params: {
    node: GetTargetNodes<$TargetSpec>
    context: $TargetSpec['context']
  }) => string[] | undefined

  getArguments?: (params: {
    node: GetTargetNodes<$TargetSpec>
    context: $TargetSpec['context']
  }) => string[] | undefined
}

// ============================================================================
// Definition
// ============================================================================

export interface Definition<
  $TargetSpec extends TargetSpec,
> {
  create: (context: $TargetSpec['context']) => Resolve<$TargetSpec>
  introspection?: Introspection<$TargetSpec>
}

// ============================================================================
// Stepper Builder
// ============================================================================

type StepperBuilder<$TargetNode, $PathNode, $Context, $ResultNode> = [$TargetNode] extends [never] ? {
    // No guard for root-child nodes (no targetNode to guard)
    step: (
      stepFn: (params: {
        pathNode: $PathNode
        context: $Context
      }) => Either.Either<$ResultNode, Stepper.StepFailure>,
    ) => void
  }
  : {
    guard<$Validated>(
      guardFn: (targetNode: $TargetNode) => Either.Either<$Validated, Stepper.GuardFailure>,
    ): {
      step: (
        stepFn: (params: {
          targetNode: $Validated
          pathNode: $PathNode
          context: $Context
        }) => Either.Either<$ResultNode, Stepper.StepFailure>,
      ) => void
    }
    step: (
      stepFn: (params: {
        targetNode: $TargetNode
        pathNode: $PathNode
        context: $Context
      }) => Either.Either<$ResultNode, Stepper.StepFailure>,
    ) => void
  }

// ============================================================================
// Define Builder
// ============================================================================

type DefineBuilder<$TargetSpec extends TargetSpec, $Steppers = {}> =
  & {
    [$Tag in Nodes.$Types.Tag & keyof $TargetSpec['nodes']]: (
      builderFn: (
        builder: StepperBuilder<
          Stepper.GetStepperInputTargetNode<$TargetSpec, $Tag>,
          Nodes.$Types.Index[$Tag],
          $TargetSpec['context'],
          $TargetSpec['nodes'][$Tag]
        >,
      ) => void,
    ) => DefineBuilder<
      $TargetSpec,
      & $Steppers
      & {
        [_ in $Tag]: {
          guard?: (targetNode: any) => Either.Either<any, Stepper.GuardFailure>
          step: (params: any) => Either.Either<any, Stepper.StepFailure>
        }
      }
    >
  }
  & {
    done: () => Definition<$TargetSpec>
  }

// ============================================================================
// Error Handling
// ============================================================================

const createTraversalError = (
  state: Stepper.TraversalState,
  stepFailure: Stepper.StepFailure,
): TraversalError.TraversalError => {
  const location: TraversalLocation = {
    currentNode: state.currentPathNode!, // Caller ensures this is not undefined
    parentChain: [...state.parentChain],
    position: state.position,
  }

  // Enrich error with introspection if available
  let suggestions: string[] | undefined
  if (state.options?.introspection && stepFailure._tag === 'NodeNotFound') {
    // Call appropriate introspector based on failing segment type
    switch (state.currentPathNode!._tag) {
      case 'GraphQLPathSegmentType':
        suggestions = state.options.introspection.getTypes?.({
          context: state.context,
        })
        break
      case 'GraphQLPathSegmentField':
        suggestions = state.options.introspection.getFields?.({
          node: state.targetParentNode,
          context: state.context,
        })
        break
      case 'GraphQLPathSegmentArgument':
        suggestions = state.options.introspection.getArguments?.({
          node: state.targetParentNode,
          context: state.context,
        })
        break
      case 'GraphQLPathSegmentResolvedType':
        // ResolvedType never fails with NodeNotFound - it's a type resolution
        // No suggestions needed
        break
    }
  }

  return new TraversalError.TraversalError({
    path: state.path,
    location,
    cause: stepFailure,
    ...(suggestions ? { suggestions } : {}),
  })
}

interface Options<$TargetSpec extends TargetSpec = TargetSpec> {
  introspection?: Introspection<$TargetSpec>
}

// ============================================================================
// Define Traverser
// ============================================================================

export const define = <$TargetSpec extends TargetSpec>(
  options?: Options<$TargetSpec>,
): DefineBuilder<$TargetSpec> => {
  const steppers: Record<string, Stepper.Stepper> = {}

  const createBuilder = (): DefineBuilder<$TargetSpec, any> => {
    const builder: any = {}

    //
    //
    //
    // ━━━━━━━━━━━━━━ • node methods
    //
    //

    const nodeTags = Nodes.$Groups.All
      .map(_ => EffectKit.Schema.TaggedStruct.getTagOrThrow(_.Schema))
      .filter(_ => _ !== 'GraphQLPathRoot')

    for (const tag of nodeTags) {
      builder[tag] = (builderFn: (b: any) => void) => {
        const stepperConfig: Stepper.Stepper = {} as Stepper.Stepper

        const stepperBuilder: StepperBuilder<any, any, any, any> = {
          guard: (guardFn) => ({
            step: (stepFn) => {
              stepperConfig.guard = guardFn
              stepperConfig.step = stepFn
            },
          }),
          step: (stepFn) => {
            stepperConfig.step = stepFn
          },
        }

        builderFn(stepperBuilder)
        steppers[tag] = stepperConfig

        return builder
      }
    }

    //
    //
    //
    // ━━━━━━━━━━━━━━ • done method
    //
    //

    // Add done method
    builder.done = (): Definition<$TargetSpec> => {
      return {
        create: (context) => {
          const resolve = (path: Path) => {
            const state: Stepper.TraversalState = {
              path,
              parentChain: [],
              position: 0,
              currentPathNode: path.next,
              targetParentNode: null,
              context,
              options,
            }

            while (state.currentPathNode) {
              const nodeTag = state.currentPathNode._tag
              state.position++

              const stepper = steppers[nodeTag]! // Type system ensures this is defined
              const result = Stepper.runStepper(stepper, state)

              if (Either.isLeft(result)) {
                // If runStepper returned a TraversalError (from guard failure), return it directly
                // Otherwise, create a TraversalError from the StepFailure
                if (result.left instanceof TraversalError.TraversalError) {
                  return result
                }
                return Either.left(createTraversalError(state, result.left))
              }

              // Update for next iteration
              state.parentChain.push(state.currentPathNode)
              state.targetParentNode = (result as any).right
              state.currentPathNode = state.currentPathNode.next
            }

            return Either.right(state.targetParentNode)
          }

          return resolve as Resolve<$TargetSpec>
        },
      }
    }

    return builder
  }

  return createBuilder()
}
