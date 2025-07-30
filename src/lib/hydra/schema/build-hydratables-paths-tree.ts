import { EffectKit } from '#lib/kit-temp/effect'
import { Match } from 'effect'
import * as AST from 'effect/SchemaAST'
import { isTypeLiteral } from 'effect/SchemaAST'
import { UHL } from '../uhl/$.js'
import {
  extractPropertyKeys,
  extractTagsFromUnion,
  findHydratablePair,
  findHydratedMember as findHydratedMemberUtil,
  isHydratableUnion,
  resolveAst,
  resolvePropertyType,
} from './ast.js'

// Local path conversion utilities for hydra
const adtNameToPath = (adtName: string): string => {
  return adtName.toLowerCase()
}

const memberNameToPath = (memberName: string): string => {
  return memberName.toLowerCase()
}

// ============================================================================
// Data Structures
// ============================================================================

/**
 * Tree structure for navigating to hydratables with unique key requirements
 */
export interface HydratablesPathsTree {
  // Map from property name to child tree
  children: Map<string, HydratablesPathsTreeNode>
  // If this node represents a hydratable, contains the tag info (without values)
  hydratableSegmentTemplate?: UHL.SegmentTemplate
}

export interface HydratablesPathsTreeNode extends HydratablesPathsTree {
  // Whether this node is part of an array
  isArrayElement?: boolean
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Builds a tree structure capturing paths to hydratables and their unique keys
 */
export const buildHydratablesPathsTree = (
  ast: AST.AST,
  visited: Map<AST.AST, HydratablesPathsTree> = new Map(),
): HydratablesPathsTree => {
  // Check cache to handle circular references
  const cached = visited.get(ast)
  if (cached) return cached

  const tree = createEmptyTree()
  visited.set(ast, tree)

  // Handle special cases that need to resolve to a different AST
  const resolvedAst = resolveAst(ast)

  // If we resolved to a different AST, process it and copy results to our tree
  if (resolvedAst !== ast) {
    const resolvedTree = buildHydratablesPathsTree(resolvedAst, visited)
    Object.assign(tree, resolvedTree)
    return tree
  }

  // Process the AST based on its type
  return Match.value(ast).pipe(
    Match.when(isHydratableUnion, (ast) => buildHydratableUnionTree(ast, tree, visited)),
    Match.tag('TypeLiteral', (typeLiteral) => {
      traverseTypeLiteralFields(typeLiteral, tree, visited)
      return tree
    }),
    Match.tag('TupleType', (tupleType) => {
      handleArrayType(tupleType, tree, visited)
      return tree
    }),
    Match.orElse(() => tree),
  )
}

// ============================================================================
// Building Blocks
// ============================================================================

/**
 * Creates an empty tree structure
 */
const createEmptyTree = (): HydratablesPathsTree => ({
  children: new Map(),
})

/**
 * Creates an array node from a child tree
 */
const createArrayNode = (childTree: HydratablesPathsTree): HydratablesPathsTreeNode => ({
  ...childTree,
  isArrayElement: true,
})

/**
 * Builds a tree for a hydratable union
 */
const buildHydratableUnionTree = (
  ast: AST.Union,
  tree: HydratablesPathsTree,
  visited: Map<AST.AST, HydratablesPathsTree>,
): HydratablesPathsTree => {
  const segmentTemplate = detectHydratableUnion(ast)
  if (segmentTemplate) {
    tree.hydratableSegmentTemplate = segmentTemplate
  }

  // Also traverse the hydrated member to find nested hydratables
  const hydratedMember = findHydratedMemberUtil(ast)
  if (hydratedMember && isTypeLiteral(hydratedMember)) {
    traverseTypeLiteralFields(hydratedMember, tree, visited)
  }

  return tree
}

/**
 * Handles array types (tuples)
 */
const handleArrayType = (
  ast: AST.TupleType,
  tree: HydratablesPathsTree,
  visited: Map<AST.AST, HydratablesPathsTree>,
): void => {
  // Handle tuple elements
  const firstElement = ast.elements[0]
  if (firstElement && 'type' in firstElement) {
    const childTree = buildHydratablesPathsTree(firstElement.type, visited)
    tree.children.set('[array]', createArrayNode(childTree))
  }

  // Handle rest elements
  const restElement = ast.rest[0]
  if (restElement) {
    const childTree = buildHydratablesPathsTree(restElement.type, visited)
    tree.children.set('[array]', createArrayNode(childTree))
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Traverses fields of a TypeLiteral and adds them to the tree
 */
const traverseTypeLiteralFields = (
  ast: AST.TypeLiteral,
  tree: HydratablesPathsTree,
  visited: Map<AST.AST, HydratablesPathsTree>,
): void => {
  for (const prop of ast.propertySignatures) {
    if (shouldSkipProperty(prop)) continue

    const propType = resolvePropertyType(prop.type)
    const childTree = buildHydratablesPathsTree(propType, visited)
    tree.children.set(String(prop.name), childTree)
  }
}

/**
 * Determines if a property should be skipped during traversal
 */
const shouldSkipProperty = (prop: AST.PropertySignature): boolean => {
  return prop.name === '_tag'
}

/**
 * Detects if a union is a hydratable pattern and creates a segment template
 */
const detectHydratableUnion = (ast: AST.Union): UHL.SegmentTemplate | null => {
  const pair = findHydratablePair(ast)

  if (!pair) return null

  const uniqueKeys = extractUniqueKeys(pair.dehydratedMember)

  // Get all tags from the union to check for ADT membership
  const allTags = extractTagsFromUnion(ast)
  const adtInfo = EffectKit.Schema.UnionAdt.getADTInfo(pair.tag, allTags)

  return UHL.makeSegmentTemplate(
    pair.tag,
    uniqueKeys,
    adtInfo?.adtName,
  )
}

/**
 * Extracts unique keys from a dehydrated member
 */
const extractUniqueKeys = (dehydratedMember: AST.TypeLiteral): string[] => {
  return extractPropertyKeys(dehydratedMember).filter(k => k !== '_tag' && k !== '_dehydrated')
}

// /**
//  * Checks if a type literal is a hydrated member (not dehydrated)
//  */
// const isHydratedMember = (member: AST.TypeLiteral): boolean => {
//   const tag = extractTag(member)
//   return tag !== null && !Tag.isDehydrated(tag)
// }
