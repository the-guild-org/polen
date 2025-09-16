import { Grafaid } from '#lib/grafaid'
import { Either } from 'effect'
import type { GraphQLSchema } from 'graphql'
import { define } from '../resolver-builder/define.js'
import { GuardFailure, StepFailures } from '../resolver-builder/stepper.js'

export const GraphqlSchema = define<{
  context: {
    schema: GraphQLSchema
  }
  nodes: {
    GraphQLPathSegmentArgument: Grafaid.Schema.Type.Argument
    GraphQLPathSegmentField: Grafaid.Schema.TypesLike.Field
    GraphQLPathSegmentType: Grafaid.Schema.TypesLike.Named
    GraphQLPathSegmentResolvedType: Grafaid.Schema.TypesLike.Named
  }
}>({
  introspection: {
    getKind({ node }) {
      if (Grafaid.Schema.TypesLike.isNamed(node)) {
        return Grafaid.Schema.typeClassNameToKindMap[
          Grafaid.Schema.typeClassToName(node)
        ]
      }
    },

    getName({ node }) {
      if (Grafaid.Schema.TypesLike.isNamed(node)) {
        return node.name
      }
    },

    getTypes({ context }) {
      // No node parameter - gets types from schema in context
      const typeMap = context.schema.getTypeMap()
      return Object.keys(typeMap).filter(name => !name.startsWith('__'))
    },

    getFields({ node }) {
      if (Grafaid.Schema.TypesLike.isFielded(node)) {
        return Object.keys(node.getFields())
      }
    },

    getArguments({ node }) {
      if (Grafaid.Schema.TypesLike.isArgable(node)) {
        return node.args.map(arg => arg.name)
      }
    },
  },
})
  .GraphQLPathSegmentType($ =>
    $.step(({ pathNode, context }) => {
      const type = context.schema.getType(pathNode.name)

      if (!type) {
        return Either.left(StepFailures.NodeNotFound({}))
      }

      return Either.right(type)
    })
  )
  .GraphQLPathSegmentField($ =>
    $
      .guard((targetNode) => {
        if (Grafaid.Schema.TypesLike.isFielded(targetNode)) {
          return Either.right(targetNode)
        }
        return Either.left(GuardFailure.make({}))
      })
      .step(({ targetNode, pathNode }) => {
        const field = targetNode.getFields()[pathNode.name]

        if (!field) {
          return Either.left(StepFailures.NodeNotFound({}))
        }

        return Either.right(field)
      })
  )
  .GraphQLPathSegmentArgument($ =>
    $
      .guard((targetNode) => {
        // Check if node can have arguments (fields and directives)
        if ('args' in targetNode && Array.isArray(targetNode.args)) {
          // It's argable (Field or Directive)
          return Either.right(targetNode as Grafaid.Schema.TypesLike.Argable)
        }

        // Not argable - return GuardFailure not StepFailure
        return Either.left(GuardFailure.make({}))
      })
      .step(({ targetNode, pathNode }) => {
        // targetNode is now typed as Argable
        const arg = targetNode.args.find((a: any) => a.name === pathNode.name)

        if (!arg) {
          return Either.left(StepFailures.NodeNotFound({}))
        }

        return Either.right(arg)
      })
  )
  .GraphQLPathSegmentResolvedType($ =>
    $.step(({ targetNode }) => {
      const namedType = Grafaid.Schema.Type.getNamed(targetNode.type)
      return Either.right(namedType)
    })
  )
  .done()
