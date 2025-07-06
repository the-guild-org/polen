/**
 * Layer 2: Schema Integration
 *
 * Bridge between GraphQL analysis and Polen's schema system.
 * Resolves identifiers against the actual schema, extracts documentation,
 * and generates reference URLs for navigation.
 */

import {
  getNamedType,
  type GraphQLField,
  type GraphQLInputField,
  type GraphQLSchema,
  type GraphQLType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
} from 'graphql'
import { analyze } from './analysis.js'
import type { Identifier } from './types.js'

/**
 * Documentation extracted from GraphQL schema
 */
export interface Documentation {
  /** Description from schema SDL or introspection */
  description?: string
  /** Type signature (e.g., "String!", "[User!]!") */
  typeInfo: string
  /** Whether this field/type is deprecated */
  deprecated?: {
    reason: string
    replacement?: string
  }
  /** Default value for arguments */
  defaultValue?: string
}

/**
 * Result of resolving an identifier against the schema
 */
export interface SchemaResolution {
  /** Whether the identifier exists in the schema */
  exists: boolean
  /** Documentation extracted from schema */
  documentation?: Documentation
  /** URL to the reference page for this identifier */
  referenceUrl: string
  /** Whether this identifier is deprecated */
  deprecated?: {
    reason: string
    replacement?: string
  }
  /** The GraphQL type if this is a type identifier */
  graphqlType?: GraphQLType
}

/**
 * Interface for resolving GraphQL identifiers against a schema
 */
export interface SchemaResolver {
  /**
   * Resolve an identifier against the schema
   */
  resolveIdentifier(identifier: Identifier): SchemaResolution | null

  /**
   * Get documentation for a schema path
   */
  getDocumentation(schemaPath: string[]): Documentation | null

  /**
   * Generate a reference URL for a schema path
   */
  generateReferenceLink(schemaPath: string[]): string

  /**
   * Check if a type exists in the schema
   */
  typeExists(typeName: string): boolean

  /**
   * Get all available types for validation
   */
  getAllTypes(): string[]
}

/**
 * Configuration for URL generation
 */
export interface RouteConfig {
  /** Base path for reference pages (default: "/reference") */
  basePath?: string
  /** Whether to include fragments in URLs (default: true) */
  includeFragments?: boolean
}

/**
 * Polen's implementation of SchemaResolver
 */
export class PolenSchemaResolver implements SchemaResolver {
  constructor(
    private schema: GraphQLSchema,
    private routeConfig: RouteConfig = {},
  ) {}

  /**
   * Resolve an identifier against the schema
   */
  resolveIdentifier(identifier: Identifier): SchemaResolution | null {
    const basePath = this.routeConfig.basePath || `/reference`

    switch (identifier.kind) {
      case `Type`:
        return this.resolveType(identifier, basePath)

      case `Field`:
        return this.resolveField(identifier, basePath)

      case `Argument`:
        return this.resolveArgument(identifier, basePath)

      case `Variable`:
        // Variables don't have schema resolution
        return {
          exists: true,
          referenceUrl: `${basePath}#variables`,
          documentation: {
            typeInfo: `Variable`,
            description: `Query variable: $${identifier.name}`,
          },
        }

      case `Directive`:
        return this.resolveDirective(identifier, basePath)

      case `Fragment`:
        // Fragments don't have schema resolution
        return {
          exists: true,
          referenceUrl: `${basePath}#fragments`,
          documentation: {
            typeInfo: `Fragment`,
            description: `Fragment: ${identifier.name}`,
          },
        }

      default:
        return null
    }
  }

  /**
   * Get documentation for a schema path
   */
  getDocumentation(schemaPath: string[]): Documentation | null {
    if (schemaPath.length === 0) return null

    const [typeName, fieldName, argName] = schemaPath

    if (!typeName) return null

    const type = this.schema.getType(typeName)
    if (!type) return null

    // Type-level documentation
    if (schemaPath.length === 1) {
      return {
        typeInfo: this.getTypeSignature(type),
        description: type.description || undefined,
        deprecated: `deprecationReason` in type
          ? {
            reason: (type as any).deprecationReason,
          }
          : undefined,
      }
    }

    // Field-level documentation
    if (fieldName && schemaPath.length === 2) {
      const field = this.getFieldFromType(type, fieldName)
      if (!field) return null

      return {
        typeInfo: this.getTypeSignature(field.type),
        description: field.description || undefined,
        deprecated: field.deprecationReason
          ? {
            reason: field.deprecationReason,
          }
          : undefined,
      }
    }

    // Argument-level documentation
    if (fieldName && argName && schemaPath.length === 3) {
      const field = this.getFieldFromType(type, fieldName)
      if (!field || !(`args` in field)) return null

      const arg = field.args.find((a: any) => a.name === argName)
      if (!arg) return null

      return {
        typeInfo: this.getTypeSignature(arg.type),
        description: arg.description || undefined,
        defaultValue: arg.defaultValue !== undefined
          ? String(arg.defaultValue)
          : undefined,
      }
    }

    return null
  }

  /**
   * Generate a reference URL for a schema path
   */
  generateReferenceLink(schemaPath: string[]): string {
    const basePath = this.routeConfig.basePath || `/reference`
    const includeFragments = this.routeConfig.includeFragments !== false

    if (schemaPath.length === 0) return basePath

    const [typeName, fieldName, argName] = schemaPath

    // Type reference
    if (schemaPath.length === 1) {
      return `${basePath}/${typeName}`
    }

    // Field reference
    if (fieldName && schemaPath.length === 2) {
      const fragment = includeFragments ? `#${fieldName}` : ``
      return `${basePath}/${typeName}${fragment}`
    }

    // Argument reference
    if (fieldName && argName && schemaPath.length === 3) {
      const fragment = includeFragments ? `#${fieldName}-${argName}` : ``
      return `${basePath}/${typeName}${fragment}`
    }

    return `${basePath}/${typeName}`
  }

  /**
   * Check if a type exists in the schema
   */
  typeExists(typeName: string): boolean {
    return !!this.schema.getType(typeName)
  }

  /**
   * Get all available types for validation
   */
  getAllTypes(): string[] {
    return Object.keys(this.schema.getTypeMap())
      .filter(name => !name.startsWith(`__`)) // Filter out introspection types
  }

  // Private helper methods

  private resolveType(identifier: Identifier, basePath: string): SchemaResolution {
    const type = this.schema.getType(identifier.name)

    return {
      exists: !!type,
      graphqlType: type || undefined,
      referenceUrl: `${basePath}/${identifier.name}`,
      documentation: type
        ? {
          typeInfo: this.getTypeSignature(type),
          description: type.description || undefined,
        }
        : undefined,
    }
  }

  private resolveField(identifier: Identifier, basePath: string): SchemaResolution {
    if (!identifier.parentType) {
      return {
        exists: false,
        referenceUrl: `${basePath}#${identifier.name}`,
      }
    }

    const parentType = this.schema.getType(identifier.parentType)
    if (!parentType) {
      return {
        exists: false,
        referenceUrl: `${basePath}/${identifier.parentType}#${identifier.name}`,
      }
    }

    const field = this.getFieldFromType(parentType, identifier.name)

    return {
      exists: !!field,
      referenceUrl: `${basePath}/${identifier.parentType}#${identifier.name}`,
      documentation: field
        ? {
          typeInfo: this.getTypeSignature(field.type),
          description: field.description || undefined,
          deprecated: field.deprecationReason
            ? {
              reason: field.deprecationReason,
            }
            : undefined,
        }
        : undefined,
      deprecated: field?.deprecationReason
        ? {
          reason: field.deprecationReason,
        }
        : undefined,
    }
  }

  private resolveArgument(identifier: Identifier, basePath: string): SchemaResolution {
    const schemaPath = identifier.schemaPath
    if (schemaPath.length < 3) {
      return {
        exists: false,
        referenceUrl: `${basePath}#${identifier.name}`,
      }
    }

    const [typeName, fieldName] = schemaPath
    if (!typeName || !fieldName) {
      return {
        exists: false,
        referenceUrl: `${basePath}#${identifier.name}`,
      }
    }

    const parentType = this.schema.getType(typeName)
    if (!parentType) {
      return {
        exists: false,
        referenceUrl: `${basePath}/${typeName}#${fieldName}-${identifier.name}`,
      }
    }

    const field = this.getFieldFromType(parentType, fieldName)
    if (!field || !(`args` in field)) {
      return {
        exists: false,
        referenceUrl: `${basePath}/${typeName}#${fieldName}-${identifier.name}`,
      }
    }

    const arg = field.args.find((a: any) => a.name === identifier.name)

    return {
      exists: !!arg,
      referenceUrl: `${basePath}/${typeName}#${fieldName}-${identifier.name}`,
      documentation: arg
        ? {
          typeInfo: this.getTypeSignature(arg.type),
          description: arg.description || undefined,
          defaultValue: arg.defaultValue !== undefined
            ? String(arg.defaultValue)
            : undefined,
        }
        : undefined,
    }
  }

  private resolveDirective(identifier: Identifier, basePath: string): SchemaResolution {
    const directive = this.schema.getDirective(identifier.name)

    return {
      exists: !!directive,
      referenceUrl: `${basePath}/directives#${identifier.name}`,
      documentation: directive
        ? {
          typeInfo: `Directive`,
          description: directive.description || undefined,
        }
        : undefined,
    }
  }

  private getFieldFromType(type: GraphQLType, fieldName: string): GraphQLField<any, any> | GraphQLInputField | null {
    if (isObjectType(type) || isInterfaceType(type)) {
      return type.getFields()[fieldName] || null
    }

    if (isInputObjectType(type)) {
      return type.getFields()[fieldName] || null
    }

    return null
  }

  private getTypeSignature(type: GraphQLType): string {
    if (isNonNullType(type)) {
      return `${this.getTypeSignature(type.ofType)}!`
    }

    if (isListType(type)) {
      return `[${this.getTypeSignature(type.ofType)}]`
    }

    return getNamedType(type).name
  }
}

/**
 * Create a schema resolver for Polen
 */
export const createPolenSchemaResolver = (
  schema: GraphQLSchema,
  routeConfig?: RouteConfig,
): SchemaResolver => {
  return new PolenSchemaResolver(schema, routeConfig)
}

/**
 * Enhanced analysis result with schema resolution
 */
export interface SchemaAwareAnalysisResult {
  /** Original analysis result */
  analysis: import('./types.js').AnalysisResult
  /** Schema resolutions for all identifiers */
  resolutions: Map<string, SchemaResolution>
  /** Validation errors from schema checking */
  schemaErrors: {
    identifier: Identifier
    message: string
    severity: `error` | `warning`
  }[]
}

/**
 * Perform schema-aware analysis of a GraphQL document
 */
export const analyzeWithSchema = (
  source: string,
  schema: GraphQLSchema,
  routeConfig?: RouteConfig,
): SchemaAwareAnalysisResult => {
  const analysis = analyze(source, {
    schema,
    validateAgainstSchema: true,
    includePositions: true,
  })

  const resolver = createPolenSchemaResolver(schema, routeConfig)
  const resolutions = new Map<string, SchemaResolution>()
  const schemaErrors: SchemaAwareAnalysisResult[`schemaErrors`] = []

  // Resolve all identifiers against schema
  for (const identifier of analysis.identifiers.all) {
    const key = `${identifier.position.start}-${identifier.name}-${identifier.kind}`
    const resolution = resolver.resolveIdentifier(identifier)

    if (resolution) {
      resolutions.set(key, resolution)

      // Add validation errors for non-existent identifiers
      if (!resolution.exists && (identifier.kind === `Type` || identifier.kind === `Field`)) {
        schemaErrors.push({
          identifier,
          message: `${identifier.kind} "${identifier.name}" does not exist in schema`,
          severity: `error`,
        })
      }

      // Add deprecation warnings
      if (resolution.deprecated) {
        schemaErrors.push({
          identifier,
          message: `${identifier.kind} "${identifier.name}" is deprecated: ${resolution.deprecated.reason}`,
          severity: `warning`,
        })
      }
    }
  }

  return {
    analysis,
    resolutions,
    schemaErrors,
  }
}
