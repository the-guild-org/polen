import { Grafaid } from '#lib/grafaid'
import { Nodes } from '../nodes/$.js'

/**
 * Get the expected parent kinds for a given path node tag.
 * Uses the graphqlKind metadata from node definitions and Grafaid's containment rules.
 */
export const getExpectedKindsForNode = (nodeTag: string): readonly string[] => {
  switch (nodeTag) {
    case 'GraphQLPathSegmentField':
      // Field nodes can only exist on Object or Interface types
      return Grafaid.Schema.Kinds.getParentKinds(Nodes.Field.graphqlKind) ?? []

    case 'GraphQLPathSegmentArgument':
      // Argument nodes can only exist on Field or Directive
      return Grafaid.Schema.Kinds.getParentKinds(Nodes.Argument.graphqlKind) ?? []

    case 'GraphQLPathSegmentType':
      // Type nodes exist at schema root
      return ['Schema']

    case 'GraphQLPathSegmentResolvedType':
      // ResolvedType can follow Field or Argument (anything with a type)
      return ['Field', 'Argument']

    default:
      return []
  }
}
