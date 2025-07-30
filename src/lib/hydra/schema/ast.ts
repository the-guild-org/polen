import { EffectKit, S } from '#lib/kit-temp/effect'
import * as AST from 'effect/SchemaAST'
import { isSuspend, isTransformation, isTypeLiteral, isUnion } from 'effect/SchemaAST'

// ============================================================================
// Core Resolution
// ============================================================================

/**
 * Resolves an AST node to its underlying type, handling transformations and suspensions
 *
 * @param ast - The AST node to resolve
 * @returns The resolved AST node
 */
export const resolveAst = (ast: AST.AST): AST.AST => {
  if (isTransformation(ast)) {
    return resolveAst(ast.from)
  }
  if (isSuspend(ast)) {
    return resolveAst(ast.f())
  }
  return ast
}

/**
 * Resolves the actual type of a property, handling suspensions
 * This is a specialized version for property types
 */
export const resolvePropertyType = (type: AST.AST): AST.AST => {
  return isSuspend(type) ? type.f() : type
}

// ============================================================================
// Struct/TypeLiteral Operations
// ============================================================================

/**
 * Extracts the schema for a specific field from a struct schema.
 *
 * Handles:
 * - TypeLiteral (standard structs)
 * - Transformation (which might wrap a struct)
 * - Suspend types (lazy schema references)
 *
 * @param schema - The struct schema to extract from
 * @param fieldName - The name of the field to extract
 * @returns The field's schema, or undefined if not found
 */
export const getFieldSchema = (
  schema: S.Schema<any, any, any>,
  fieldName: string,
): S.Schema<any, any, never> | undefined => {
  const ast = schema.ast

  // Handle TypeLiteral (structs)
  if (isTypeLiteral(ast)) {
    const prop = ast.propertySignatures.find((p: any) => p.name === fieldName)
    if (prop) {
      let fieldAst = prop.type

      // Resolve Suspend types
      if (isSuspend(fieldAst)) {
        fieldAst = fieldAst.f()
      }

      return S.make(fieldAst)
    }
  }

  // Handle Transformation (might wrap a struct)
  if (isTransformation(ast)) {
    return getFieldSchema(S.make(ast.from), fieldName)
  }

  return undefined
}

/**
 * Extracts all property keys from a TypeLiteral (struct).
 *
 * @param ast - The TypeLiteral AST node
 * @returns Array of property names as strings
 */
export const extractPropertyKeys = (ast: AST.TypeLiteral): string[] => {
  return ast.propertySignatures
    .map(p => p.name as string)
    .filter(name => typeof name === 'string')
}

/**
 * Gets a property signature from a TypeLiteral by name.
 *
 * @param ast - The TypeLiteral AST node
 * @param propertyName - The name of the property to find
 * @returns The property signature, or undefined if not found
 */
export const getPropertySignature = (
  ast: AST.TypeLiteral,
  propertyName: string | symbol,
): AST.PropertySignature | undefined => {
  return ast.propertySignatures.find(p => p.name === propertyName)
}

/**
 * Checks if a property exists in a TypeLiteral.
 *
 * @param ast - The TypeLiteral AST node
 * @param propertyName - The name of the property to check
 * @returns True if the property exists, false otherwise
 */
export const hasProperty = (
  ast: AST.TypeLiteral,
  propertyName: string | symbol,
): boolean => {
  return getPropertySignature(ast, propertyName) !== undefined
}

/**
 * Extracts the type AST of a specific property from a TypeLiteral.
 * Automatically resolves Suspend types.
 *
 * @param ast - The TypeLiteral AST node
 * @param propertyName - The name of the property
 * @returns The property's type AST, or undefined if not found
 */
export const getPropertyType = (
  ast: AST.TypeLiteral,
  propertyName: string | symbol,
): AST.AST | undefined => {
  const prop = getPropertySignature(ast, propertyName)
  if (!prop) return undefined

  // Resolve Suspend types
  return isSuspend(prop.type) ? prop.type.f() : prop.type
}

// ============================================================================
// Union Operations
// ============================================================================

/**
 * Use EffectKit for extracting tags from TypeLiterals
 */
export const extractTag = EffectKit.Schema.AST.extractTag

/**
 * Use EffectKit for collecting tagged members from unions
 */
export const collectTaggedMembers = EffectKit.Schema.AST.collectTaggedMembers

/**
 * Extracts all tags from a union
 */
export const extractTagsFromUnion = (ast: AST.Union): string[] => {
  const tags: string[] = []

  for (const member of ast.types) {
    if (isTypeLiteral(member)) {
      const tag = extractTag(member)
      if (tag) {
        tags.push(tag)
      }
    }
  }

  return tags
}

// ============================================================================
// Hydratable Detection (Spec-Aligned)
// ============================================================================

/**
 * Result of finding a hydratable pair in a union
 * Used for implicit hydratable pattern detection (legacy)
 */
export interface HydratablePair {
  hydratedMember: AST.TypeLiteral
  dehydratedMember: AST.TypeLiteral
  tag: string
}

/**
 * Checks if a TypeLiteral has a _dehydrated: true field
 * Used for implicit hydratable pattern detection
 */
export const hasDehydratedField = (member: AST.TypeLiteral): boolean => {
  const dehydratedProp = member.propertySignatures.find(p => p.name === '_dehydrated')
  if (!dehydratedProp) return false

  // Check if it's a literal true
  return AST.isLiteral(dehydratedProp.type) && dehydratedProp.type.literal === true
}

/**
 * Finds a hydratable pair in a union (members with same tag, one with _dehydrated: true)
 * This is for implicit hydratable pattern detection (not annotation-based)
 */
export const findHydratablePair = (ast: AST.Union): HydratablePair | null => {
  // Group members by tag
  const membersByTag = new Map<string, AST.TypeLiteral[]>()

  for (const member of ast.types) {
    if (isTypeLiteral(member)) {
      const tag = extractTag(member)
      if (tag) {
        const members = membersByTag.get(tag) || []
        members.push(member)
        membersByTag.set(tag, members)
      }
    }
  }

  // Find a tag that has both hydrated and dehydrated forms
  for (const [tag, members] of membersByTag) {
    if (members.length === 2) {
      const dehydrated = members.find(hasDehydratedField)
      const hydrated = members.find(m => !hasDehydratedField(m))

      if (dehydrated && hydrated) {
        return {
          hydratedMember: hydrated,
          dehydratedMember: dehydrated,
          tag,
        }
      }
    }
  }

  return null
}

/**
 * Checks if an AST node is a hydratable union (contains hydrated/dehydrated pair with same tag)
 * This is for implicit pattern detection
 */
export const isHydratableUnion = (ast: AST.AST): ast is AST.Union => {
  return isUnion(ast) && findHydratablePair(ast) !== null
}

/**
 * Finds the hydrated member in a hydratable union (the one without _dehydrated field)
 */
export const findHydratedMember = (ast: AST.Union): AST.TypeLiteral | null => {
  const pair = findHydratablePair(ast)
  return pair ? pair.hydratedMember : null
}

/**
 * Finds the dehydrated member in a hydratable union (the one with _dehydrated: true)
 */
export const findDehydratedMember = (ast: AST.Union): AST.TypeLiteral | null => {
  const pair = findHydratablePair(ast)
  return pair ? pair.dehydratedMember : null
}

/**
 * Extracts the hydrated member AST from a hydratable union.
 *
 * Given a union with hydrated/dehydrated forms, returns the hydrated member.
 *
 * @throws if the union doesn't have a hydratable pattern
 */
export const extractHydratedMemberAST = (ast: AST.Union): AST.TypeLiteral => {
  const pair = findHydratablePair(ast)

  if (!pair) {
    throw new Error('No hydratable pattern found in union')
  }

  return pair.hydratedMember
}