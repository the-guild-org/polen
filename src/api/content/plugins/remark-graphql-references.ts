import type { LoadedCatalog } from '#api/schema/input-source/load'
import { Diagnostic } from '#lib/diagnostic'
import { GraphQLSchemaPath } from '#lib/graphql-schema-path'
import type { Version } from '#lib/version'
import { Either } from 'effect'
import type { InlineCode, Root } from 'mdast'
import type { Plugin } from 'unified'
import type { Parent } from 'unist'
import { visit } from 'unist-util-visit'

interface GraphQLReferenceOptions {
  schemaLoader: () => LoadedCatalog | null
  onDiagnostic?: (diagnostic: Diagnostic.Diagnostic) => void
}

/**
 * Remark plugin that transforms `gql:path` inline code into GraphQLReference components.
 *
 * Syntax: `gql:Type.field` or `gql:Type`
 * Output: <GraphQLReference path="Type.field">Type.field</GraphQLReference>
 */
export const remarkGraphQLReferences: Plugin<[GraphQLReferenceOptions], Root> = (options) => {
  return (tree, file) => {
    const loadedCatalog = options.schemaLoader()
    const schema = loadedCatalog?.data
    const diagnostics: Diagnostic.Diagnostic[] = []

    visit(tree, 'inlineCode', (node: InlineCode, index: number | undefined, parent: Parent | undefined) => {
      // Skip if not a gql reference or no parent/index
      if (!node.value.startsWith('gql:')) {
        return
      }
      if (parent === undefined || index === undefined) {
        return
      }

      // Extract the GraphQL path (remove gql: prefix)
      const gqlPath = node.value.slice(4)

      // Validate the path against schema if available
      let isValidPath = false
      let resolvedVersion: Version.Version | undefined

      if (schema && gqlPath) {
        try {
          // Parse the path using GraphQLSchemaPath
          const parsedPath = GraphQLSchemaPath.decodeSync(gqlPath)

          // Check if this is a valid type/field reference
          if (schema._tag === 'CatalogVersioned') {
            // For versioned schemas, check latest version first
            // Note: entries is a HashMap, need to iterate over its values
            const entries = Array.from(schema.entries)
            for (const [versionKey, versionSchema] of entries.reverse()) {
              // Create a resolver for this version's schema
              const resolver = GraphQLSchemaPath.Resolvers.GraphqlSchema.create({
                schema: versionSchema.definition,
              })
              const result = resolver(parsedPath as any)

              if (Either.isRight(result)) {
                isValidPath = true
                resolvedVersion = versionKey
                break
              }
            }
          } else if (schema._tag === 'CatalogUnversioned') {
            // For unversioned schemas
            const resolver = GraphQLSchemaPath.Resolvers.GraphqlSchema.create({
              schema: schema.schema.definition,
            })
            const result = resolver(parsedPath as any)

            if (Either.isRight(result)) {
              isValidPath = true
            }
          }

          if (!isValidPath) {
            diagnostics.push({
              _tag: 'Diagnostic' as const,
              source: 'mdx-graphql-references',
              name: 'invalid-path',
              severity: 'warning',
              message: `Cannot resolve GraphQL path: ${gqlPath} in ${file.path}`,
            })
          }
        } catch (error) {
          // Path parsing error
          diagnostics.push({
            _tag: 'Diagnostic' as const,
            source: 'mdx-graphql-references',
            name: 'invalid-syntax',
            severity: 'warning',
            message: `Invalid GraphQL path syntax: ${gqlPath} in ${file.path}${
              error instanceof Error ? `: ${error.message}` : ''
            }`,
          })
        }
      }

      // Transform to JSX node regardless of validation
      // (we want to render the link even if we can't validate it)
      const jsxNode = {
        type: 'mdxJsxTextElement',
        name: 'GraphQLReference',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'path',
            value: gqlPath,
          },
          ...(resolvedVersion
            ? [{
              type: 'mdxJsxAttribute',
              name: 'version',
              value: String(resolvedVersion.value),
            }]
            : []),
        ],
        children: [{
          type: 'text',
          value: gqlPath,
        }],
        position: node.position,
      }

      // Replace the inline code node with JSX node
      parent.children[index] = jsxNode as any
    })

    // Report diagnostics
    if (diagnostics.length > 0 && options.onDiagnostic) {
      diagnostics.forEach(d => options.onDiagnostic!(d))
    }
  }
}
