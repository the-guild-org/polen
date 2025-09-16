import { Nodes } from './nodes/$.js'
import { print } from './printer.js'

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  GraphQLPathRoot: '\x1b[90m', // gray (for version)
  GraphQLPathSegmentType: '\x1b[36m', // cyan
  GraphQLPathSegmentField: '\x1b[33m', // yellow
  GraphQLPathSegmentArgument: '\x1b[35m', // magenta
  GraphQLPathSegmentResolvedType: '\x1b[32m', // green
  separator: '\x1b[90m', // gray
  reset: '\x1b[0m',
} as const

/**
 * Pretty print a GraphQL schema path with syntax highlighting for terminal output.
 * Useful for debugging, error messages, and CLI tools.
 *
 * @example
 * prettyPrint(parse('User.posts$limit'))
 * // Returns colored output: cyan(User) gray(.) yellow(posts) gray($) magenta(limit)
 */
export const prettyPrint = (path: Nodes.Root.Root): string => {
  return print(path, ({ node, nodeString, separator }) => {
    const coloredSeparator = separator ? `${COLORS.separator}${separator}${COLORS.reset}` : ''
    const nodeColor = COLORS[node._tag as keyof typeof COLORS] ?? ''

    // ResolvedType nodes have no content, only show the colored separator
    if (node._tag === 'GraphQLPathSegmentResolvedType') {
      return `${coloredSeparator}${nodeColor}${COLORS.reset}`
    }

    return `${coloredSeparator}${nodeColor}${nodeString}${COLORS.reset}`
  })
}
