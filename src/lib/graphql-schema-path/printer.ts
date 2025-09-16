import { EffectKit } from '#lib/kit-temp/effect'
import { Match } from 'effect'
import { Nodes } from './nodes/$.js'
import { Parser } from './parser/$.js'

/**
 * Separator map using token display values from the parser.
 * These separators appear BEFORE the node name in the string representation.
 */
const NodeSeperators = {
  GraphQLPathRoot: '',
  GraphQLPathSegmentType: '', // Type nodes have no separator (they're the root)
  GraphQLPathSegmentField: EffectKit.Schema.Literal.getValueAtField(Parser.Tokens.DotToken, 'display'),
  GraphQLPathSegmentArgument: EffectKit.Schema.Literal.getValueAtField(Parser.Tokens.DollarToken, 'display'),
  GraphQLPathSegmentResolvedType: EffectKit.Schema.Literal.getValueAtField(Parser.Tokens.HashToken, 'display'),
} as const

/**
 * Parameters passed to the formatPath callback.
 */
export interface FormatNodeParams {
  /** The complete node string including separator and content */
  nodeString: string
  /** The AST node being formatted */
  node: Nodes.$Groups.$Any
  /** The separator for this node */
  separator: string
}

/**
 * Print a GraphQL schema path AST to its string representation.
 * This is the inverse of the parse operation.
 *
 * @example
 * print(parse('User.posts$limit#')) // 'User.posts$limit#'
 * print(parse('v1.0:Query.users')) // 'v1.0:Query.users'
 */
export const print = (
  path: Nodes.Root.Root,
  formatNode?: (params: FormatNodeParams) => string,
): string => {
  // Default formatter just concatenates separator and nodeString
  const formatter = formatNode ?? (({ nodeString, separator }) => separator + nodeString)
  const parts: string[] = []

  // Start traversal from the root node itself
  let current: Nodes.$Groups.$Any = path

  while (current) {
    // Root node has no separator, others use their defined separators
    const separator = current._tag === 'GraphQLPathRoot' ? '' : NodeSeperators[current._tag]

    // Build the node string internally
    const nodeString = Match.value(current)
      .pipe(
        Match.tagsExhaustive({
          GraphQLPathRoot: (n) => n.version ? `${n.version}:` : '',
          GraphQLPathSegmentType: (n) => n.name,
          GraphQLPathSegmentField: (n) => n.name,
          GraphQLPathSegmentArgument: (n) => n.name,
          GraphQLPathSegmentResolvedType: () => '',
        }),
      )

    // Only add non-empty parts (root without version produces empty string)
    if (nodeString || separator) {
      parts.push(formatter({ nodeString, node: current, separator }))
    }

    current = current.next as any
  }

  return parts.join('')
}
