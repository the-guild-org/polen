import { S } from '#lib/kit-temp/effect'
import * as AST from 'effect/SchemaAST'
import { isTypeLiteral, isUnion } from 'effect/SchemaAST'
import { HydrationConfigSymbol } from '../hydratable.js'
import { extractTag, findHydratablePair, isHydratableUnion } from './ast.js'

// ============================================================================
// Types
// ============================================================================

/**
 * Registry mapping tags to their containing schemas
 */
export type HydratableRegistry = Record<string, S.Schema.Any>

// ============================================================================
// Registry Builder
// ============================================================================

/**
 * Builds a registry of all hydratable schemas in the AST
 * Maps tag → schema for O(1) lookups
 */
export const buildHydratableRegistry = (
  schema: S.Schema.Any,
  registry: HydratableRegistry = {},
  visited = new Set<AST.AST>(),
): HydratableRegistry => {
  const ast = schema.ast

  // Avoid infinite recursion
  if (visited.has(ast)) return registry
  visited.add(ast)

  // Check if this schema has hydration annotations
  const hydrationKeys = (schema as any).annotations?.[HydrationConfigSymbol]
    || (ast as any).annotations?.[HydrationConfigSymbol]

  if (hydrationKeys) {
    // This schema is explicitly marked as hydratable
    if (isTypeLiteral(ast)) {
      // Tagged struct - add single entry
      const tag = extractTag(ast)
      if (tag) {
        registry[tag] = schema
      }
    } else if (isUnion(ast)) {
      // Union - add entry for each member tag
      for (const member of ast.types) {
        if (isTypeLiteral(member)) {
          const tag = extractTag(member)
          if (tag && typeof hydrationKeys === 'object' && tag in hydrationKeys) {
            registry[tag] = schema
          }
        }
      }
    }
  } else if (isUnion(ast) && isHydratableUnion(ast)) {
    // Implicit hydratable pattern (X/XDehydrated)
    const pair = findHydratablePair(ast)
    if (pair) {
      // Extract unique keys from the dehydrated member
      const uniqueKeys = pair.dehydratedMember.propertySignatures
        .filter(prop => prop.name !== '_tag' && prop.name !== '_dehydrated')
        .map(prop => String(prop.name))

      // Create a synthetic schema for the union with implicit keys
      const implicitSchema = S.make(ast).annotations({
        [HydrationConfigSymbol]: {
          [pair.tag]: uniqueKeys,
        },
      })

      registry[pair.tag] = implicitSchema
    }
  }

  // Recursively process nested schemas
  if (isTypeLiteral(ast)) {
    // Process property types
    for (const prop of ast.propertySignatures) {
      const propSchema = S.make(prop.type)
      buildHydratableRegistry(propSchema, registry, visited)
    }
  } else if (isUnion(ast)) {
    // Process union members
    for (const member of ast.types) {
      const memberSchema = S.make(member)
      buildHydratableRegistry(memberSchema, registry, visited)
    }
  } else if (ast._tag === 'TupleType') {
    // Process array elements
    for (const element of ast.elements) {
      if ('type' in element) {
        const elementSchema = S.make(element.type)
        buildHydratableRegistry(elementSchema, registry, visited)
      }
    }
    for (const rest of ast.rest) {
      const restSchema = S.make(rest.type)
      buildHydratableRegistry(restSchema, registry, visited)
    }
  } else if (ast._tag === 'Suspend') {
    // Follow suspensions
    const suspended = ast.f()
    const suspendedSchema = S.make(suspended)
    buildHydratableRegistry(suspendedSchema, registry, visited)
  } else if (ast._tag === 'Refinement') {
    // Process base type
    const baseSchema = S.make(ast.from)
    buildHydratableRegistry(baseSchema, registry, visited)
  }

  return registry
}

// ============================================================================
// Registry Operations
// ============================================================================

/**
 * Get hydration keys for a specific tag from the registry
 */
export const getHydrationKeysFromRegistry = (
  registry: HydratableRegistry,
  tag: string,
): readonly string[] => {
  const schema = registry[tag]
  if (!schema) return []

  // Check both schema annotations and AST annotations
  const schemaAnnotation = (schema as any).annotations?.[HydrationConfigSymbol]
  const astAnnotation = (schema.ast as any).annotations?.[HydrationConfigSymbol]
  const annotation = schemaAnnotation || astAnnotation

  if (!annotation) return []

  // Handle both array (tagged struct) and object (union) annotations
  if (Array.isArray(annotation)) {
    return annotation
  } else if (typeof annotation === 'object') {
    return annotation[tag] ?? []
  }

  return []
}
