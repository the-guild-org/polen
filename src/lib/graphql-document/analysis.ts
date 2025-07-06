import {
  type ArgumentNode,
  type ASTNode,
  type DirectiveNode,
  type DocumentNode,
  type FieldNode,
  type FragmentDefinitionNode,
  type GraphQLError,
  type GraphQLSchema,
  type OperationDefinitionNode,
  parse,
  validate,
  type VariableDefinitionNode,
  visit,
} from 'graphql'
import type {
  AnalysisConfig,
  AnalysisError,
  AnalysisResult,
  GraphQLAnalyzer,
  Identifier,
  IdentifierContext,
  IdentifierMap,
} from './types.js'

/**
 * Default GraphQL document analyzer implementation
 */
export class DefaultGraphQLAnalyzer implements GraphQLAnalyzer {
  /**
   * Parse a GraphQL document string into an AST
   */
  parse(source: string): DocumentNode {
    try {
      return parse(source, {
        noLocation: false, // We need location info for positioning
      })
    } catch (error) {
      throw new Error(`Failed to parse GraphQL document: ${error instanceof Error ? error.message : `Unknown error`}`)
    }
  }

  /**
   * Validate a GraphQL document against a schema
   */
  validateAgainstSchema(ast: DocumentNode, schema: GraphQLSchema): GraphQLError[] {
    return [...validate(schema, ast)]
  }

  /**
   * Extract all identifiers from a GraphQL AST
   */
  extractIdentifiers(ast: DocumentNode, config: AnalysisConfig = {}): IdentifierMap {
    const identifiers: Identifier[] = []
    const errors: AnalysisError[] = []
    const schema = config.schema

    // Context tracking during traversal
    let currentOperationType: `query` | `mutation` | `subscription` | undefined
    let currentOperationName: string | undefined
    let currentFragment: string | undefined
    let selectionPath: string[] = []
    let parentTypes: string[] = []

    // Helper function to create context
    const createContext = (): IdentifierContext => {
      return {
        operationType: currentOperationType,
        operationName: currentOperationName,
        inFragment: currentFragment,
        selectionPath: [...selectionPath],
      }
    }

    visit(ast, {
      OperationDefinition: {
        enter: (node: OperationDefinitionNode) => {
          currentOperationType = node.operation
          currentOperationName = node.name?.value
          selectionPath = []

          // Set the root type based on operation type
          if (schema) {
            if (node.operation === `query` && schema.getQueryType()) {
              parentTypes = [schema.getQueryType()!.name]
            } else if (node.operation === `mutation` && schema.getMutationType()) {
              parentTypes = [schema.getMutationType()!.name]
            } else if (node.operation === `subscription` && schema.getSubscriptionType()) {
              parentTypes = [schema.getSubscriptionType()!.name]
            } else {
              parentTypes = []
            }
          } else {
            // Fallback to default root type names
            if (node.operation === `query`) {
              parentTypes = [`Query`]
            } else if (node.operation === `mutation`) {
              parentTypes = [`Mutation`]
            } else if (node.operation === `subscription`) {
              parentTypes = [`Subscription`]
            } else {
              parentTypes = []
            }
          }
        },
        leave: () => {
          currentOperationType = undefined
          currentOperationName = undefined
          parentTypes = []
        },
      },

      FragmentDefinition: {
        enter: (node: FragmentDefinitionNode) => {
          currentFragment = node.name.value
          selectionPath = []
          parentTypes = [node.typeCondition.name.value]

          // Add fragment name as identifier
          this.addIdentifier(identifiers, {
            name: node.name.value,
            kind: `Fragment`,
            position: this.getPosition(node.name),
            schemaPath: [node.name.value],
            context: createContext(),
          })

          // Add type condition as identifier
          this.addIdentifier(identifiers, {
            name: node.typeCondition.name.value,
            kind: `Type`,
            position: this.getPosition(node.typeCondition.name),
            schemaPath: [node.typeCondition.name.value],
            context: createContext(),
          })
        },
        leave: () => {
          currentFragment = undefined
          parentTypes = []
        },
      },

      Field: {
        enter: (node: FieldNode) => {
          const fieldName = node.name.value
          const parentType = parentTypes[parentTypes.length - 1]

          selectionPath.push(fieldName)

          this.addIdentifier(identifiers, {
            name: fieldName,
            kind: `Field`,
            position: this.getPosition(node.name),
            parentType,
            schemaPath: parentType ? [parentType, fieldName] : [fieldName],
            context: createContext(),
          })

          // Track parent type for nested selections
          // Resolve the field's return type from schema if available
          let pushedType = false
          if (schema && parentType) {
            const type = schema.getType(parentType)
            if (type && (`getFields` in type)) {
              const fields = (type as any).getFields()
              const field = fields[fieldName]
              if (field) {
                // Get the base type name (unwrap NonNull and List wrappers)
                let fieldType = field.type
                while (fieldType.ofType) {
                  fieldType = fieldType.ofType
                }
                if (fieldType.name) {
                  parentTypes.push(fieldType.name)
                  pushedType = true
                }
              }
            }
          } else if (this.isObjectField(fieldName)) {
            // Fallback to inference if no schema
            const inferredType = this.inferReturnType(parentType, fieldName)
            parentTypes.push(inferredType)
            pushedType = true
          } // Store whether we pushed a type for this field

          ;(node as any)._pushedType = pushedType
        },
        leave: (node: FieldNode) => {
          selectionPath.pop()

          // Remove parent type if we added one in enter
          if ((node as any)._pushedType) {
            parentTypes.pop()
          }
        },
      },

      Argument: {
        enter: (node: ArgumentNode) => {
          const argName = node.name.value
          const parentType = parentTypes[parentTypes.length - 1]
          const fieldName = selectionPath[selectionPath.length - 1]

          this.addIdentifier(identifiers, {
            name: argName,
            kind: `Argument`,
            position: this.getPosition(node.name),
            parentType,
            schemaPath: parentType && fieldName
              ? [parentType, fieldName, argName]
              : [argName],
            context: createContext(),
          })
        },
      },

      VariableDefinition: {
        enter: (node: VariableDefinitionNode) => {
          this.addIdentifier(identifiers, {
            name: node.variable.name.value,
            kind: `Variable`,
            position: this.getPosition(node.variable.name),
            schemaPath: [node.variable.name.value],
            context: createContext(),
          })

          // Also add the type reference
          const typeName = this.extractTypeName(node.type)
          if (typeName) {
            this.addIdentifier(identifiers, {
              name: typeName,
              kind: `Type`,
              position: this.getTypePosition(node.type),
              schemaPath: [typeName],
              context: createContext(),
            })
          }
        },
      },

      Directive: {
        enter: (node: DirectiveNode) => {
          this.addIdentifier(identifiers, {
            name: node.name.value,
            kind: `Directive`,
            position: this.getPosition(node.name),
            schemaPath: [node.name.value],
            context: createContext(),
          })
        },
      },
    })

    return this.createIdentifierMap(identifiers, errors)
  }

  /**
   * Perform complete analysis of a GraphQL document
   */
  analyze(source: string, config: AnalysisConfig = {}): AnalysisResult {
    try {
      const ast = this.parse(source)
      const identifiers = this.extractIdentifiers(ast, config)

      let validationErrors: GraphQLError[] = []
      if (config.validateAgainstSchema && config.schema) {
        validationErrors = this.validateAgainstSchema(ast, config.schema)
      }

      return {
        ast,
        identifiers,
        isValid: validationErrors.length === 0,
        errors: validationErrors,
      }
    } catch (error) {
      return {
        ast: { kind: `Document`, definitions: [] } as DocumentNode,
        identifiers: this.createIdentifierMap([], [{
          message: error instanceof Error ? error.message : `Unknown parsing error`,
          severity: `error`,
        }]),
        isValid: false,
        errors: [],
      }
    }
  }

  // Private helper methods

  private addIdentifier(identifiers: Identifier[], identifier: Identifier): void {
    identifiers.push(identifier)
  }

  private getPosition(node: ASTNode): Identifier[`position`] {
    const loc = node.loc
    if (!loc) {
      return { start: 0, end: 0, line: 1, column: 1 }
    }

    return {
      start: loc.start,
      end: loc.end,
      line: loc.startToken.line,
      column: loc.startToken.column,
    }
  }

  private getTypePosition(node: ASTNode): Identifier[`position`] {
    // For type nodes, we need to extract the base type name position
    // This is a simplified implementation
    return this.getPosition(node)
  }

  private extractTypeName(typeNode: any): string | null {
    // Recursively extract the base type name from wrapped types (NonNull, List)
    if (typeNode.kind === `NamedType`) {
      return typeNode.name.value
    }
    if (typeNode.kind === `NonNullType` || typeNode.kind === `ListType`) {
      return this.extractTypeName(typeNode.type)
    }
    return null
  }

  private isObjectField(fieldName: string): boolean {
    // This is only used as a fallback when no schema is available
    // Common patterns for object-returning fields
    const objectFieldPatterns = [
      `user`,
      `users`,
      `post`,
      `posts`,
      `comment`,
      `comments`,
      `profile`,
      `settings`,
      `organization`,
      `project`,
      `target`,
      `member`,
      `members`,
      `node`,
      `nodes`,
      `edge`,
      `edges`,
    ]
    return objectFieldPatterns.some(pattern => fieldName.toLowerCase().includes(pattern))
  }

  private inferReturnType(parentType: string | undefined, fieldName: string): string {
    // Simplified type inference - in real implementation would use schema
    if (fieldName === `user`) return `User`
    if (fieldName === `posts`) return `Post`
    if (fieldName === `comments`) return `Comment`
    return fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
  }

  private createContext(
    operationType?: `query` | `mutation` | `subscription`,
    operationName?: string,
    inFragment?: string,
    selectionPath: string[] = [],
  ): IdentifierContext {
    return {
      operationType,
      operationName,
      inFragment,
      selectionPath: [...selectionPath],
    }
  }

  private createIdentifierMap(identifiers: Identifier[], errors: AnalysisError[]): IdentifierMap {
    const byPosition = new Map<number, Identifier>()
    const byKind = new Map<Identifier[`kind`], Identifier[]>()

    for (const identifier of identifiers) {
      // Index by position
      byPosition.set(identifier.position.start, identifier)

      // Group by kind
      if (!byKind.has(identifier.kind)) {
        byKind.set(identifier.kind, [])
      }
      byKind.get(identifier.kind)!.push(identifier)
    }

    return {
      byPosition,
      byKind,
      errors,
      all: identifiers,
    }
  }
}

/**
 * Default analyzer instance
 */
export const analyzer = new DefaultGraphQLAnalyzer()

/**
 * Convenience function to analyze a GraphQL document
 */
export const analyze = (source: string, config?: AnalysisConfig): AnalysisResult => {
  return analyzer.analyze(source, config)
}

/**
 * Convenience function to extract identifiers from a GraphQL document
 */
export const extractIdentifiers = (source: string, config?: AnalysisConfig): IdentifierMap => {
  const ast = analyzer.parse(source)
  return analyzer.extractIdentifiers(ast, config)
}
