import type { Ob } from '#lib/kit-temp/$'
import { EffectKit } from '#lib/kit-temp/effect'
import { S } from '#lib/kit-temp/effect'
import { Hash, Match, ParseResult } from 'effect'
import { isPropertySignature } from 'effect/Schema'
import * as AST from 'effect/SchemaAST'
import { isTypeLiteral, isUnion } from 'effect/SchemaAST'
import { Value } from '../value/$.js'
import { type Options, type OptionsWithDefualts } from './options.js'

type AnyAdt = EffectKit.Schema.UnionAdt.$any
type AnyStruct = EffectKit.Schema.TaggedStruct.$any
type AnySchema = S.Schema<any, any, any>
type SingletonSchema = S.Schema<any, any, any> // Transformation schemas that encode to scalars

// ============================================================================
// Hydration Config
// ============================================================================

/**
 * The unique keys for a hydratable - a record of string/number values
 */
export const UniqueKeys = S.Record({ key: S.String, value: S.Union(S.String, S.Number) })
export type UniqueKeys = S.Schema.Type<typeof UniqueKeys>

/**
 * Mutable variant of UniqueKeys for building up the object
 */
export type UniqueKeysMutable = Record<string, string | number>

/**
 * An index mapping hydratable tags to their AST nodes
 */
export type ASTIndex = Map<string, AST.AST>

/**
 * Map type for schema encoders - tag to encoder function
 */
export type EncodersMap = Map<string, (value: unknown) => unknown>

// ============================================================================
// Context
// ============================================================================

/**
 * Context object containing all hydration-related data
 */
export interface Context {
  readonly astIndex: ASTIndex
  readonly encodersIndex: EncodersMap
  readonly originalSchema: S.Schema.Any
  readonly transformedSchema?: S.Schema.Any
  readonly transformedAstIndex?: Map<string, S.Schema.Any>
}

/**
 * Build encoders for all hydratable types in the index
 */
export const buildEncoders = (index: ASTIndex): EncodersMap => {
  const encoders: EncodersMap = new Map()
  for (const [tag, ast] of index) {
    // Create encoder from AST
    encoders.set(tag, ParseResult.encodeSync(S.make(ast)))
  }
  return encoders
}

/**
 * Create a hydration context from a schema
 */
export const createContext = (schema: S.Schema.Any): Context => {
  const astIndex = buildASTIndex(schema)
  const encodersIndex = buildEncoders(astIndex)
  return {
    astIndex,
    encodersIndex,
    originalSchema: schema,
  }
}

/**
 * Configuration for hydration behavior - defines which keys make a hydratable unique
 */
export const HydratableConfigStruct = S.TaggedStruct('HydratableConfigStruct', {
  uniqueKeys: S.Array(S.String),
})

export const HydratableConfigAdt = S.TaggedStruct('HydratableConfigAdt', {
  name: S.String,
  memberKeys: S.Record({ key: S.String, value: S.Array(S.String) }),
})

export const HydratableConfigSingleton = S.TaggedStruct('HydratableConfigSingleton', {
  // Empty - singleton hydratables have no explicit keys
}).annotations({
  description: 'Configuration for singleton hydratables that use content-based addressing',
})

export const Config = S.Union(HydratableConfigStruct, HydratableConfigAdt, HydratableConfigSingleton).annotations({
  identifier: 'HydratableConfig',
  description: 'Configuration for hydration behavior',
})

export type Config = S.Schema.Type<typeof Config>

/**
 * Symbol for tracking hydration keys at type and runtime level
 */
export const HydrationConfigSymbol = Symbol.for('@hydra/keys')

type HydrationConfigSymbol = typeof HydrationConfigSymbol

export type GetConfig<$Hydratable extends Hydratable> = $Hydratable[HydrationConfigSymbol]

export const getConfigOrThrow = <hydratable_>(
  hydratable: hydratable_,
): hydratable_ extends Hydratable ? GetConfig<hydratable_> : never => {
  const config = getConfigMaybe(hydratable)
  if (!config) throw new Error('Schema is not hydratable or does not have hydration config')
  return config as any
}

/**
 * Try to get the hydration config from a schema, returning undefined if not present
 */
// @claude make this use effect Option
export const getConfigMaybe = (schema: unknown): Config | null => {
  if (!schema) {
    return null
  }
  // console.log('getConfigMaybe', schema, schema.annotations)
  if (schema instanceof AST.PropertySignature) {
    return getConfigMaybeFromAnnotations(schema.annotations)
  }
  if (schema instanceof AST.TupleType) {
    return getConfigMaybeFromAnnotations(schema.annotations)
  }
  const ast = (schema as any).ast
  if (!ast || typeof ast !== 'object') return null
  const annotations = ast.annotations
  if (!annotations || typeof annotations !== 'object') return null
  return getConfigMaybeFromAnnotations(annotations)
}

export const getConfigMaybeFromAstNode = (node: AST.AST): Config | null => {
  return getConfigMaybeFromAnnotations(node.annotations)
}

export const getConfigMaybeFromAnnotations = (annotations: AST.Annotations): Config | null => {
  const config = annotations[HydrationConfigSymbol] as Config | undefined
  return config || null
}

type HydratableConfigInput = Options.Keys

// ============================================================================
// Core
// ============================================================================

/**
 * A hydratable that is NOT in singleton mode - has explicit unique keys.
 * These hydratables support both makeDehydrated() and dehydrate() methods.
 * Singleton hydratables only support dehydrate() since they need the actual value to generate a hash.
 */
export type HydratableNonSingleton<
  $Schema extends AnySchema = AnySchema,
  $Keys extends readonly string[] = readonly string[],
> = Hydratable<$Schema, Options<$Keys>> & {
  // Ensure the config is not singleton
  readonly [HydrationConfigSymbol]: typeof HydratableConfigStruct | typeof HydratableConfigAdt
}

/**
 * Enhanced schema interface that tracks hydration keys at type level
 */
export type Hydratable<
  $Schema extends AnySchema = AnySchema,
  // todo: use this
  _$Options extends Options = Options,
> = $Schema & HydratableProperties<$Schema>

export interface HydratableProperties<
  $Schema extends AnySchema,
  ___Decoded extends object = EffectKit.Schema.ArgDecoded<$Schema>,
  ___Encoded extends object = EffectKit.Schema.ArgEncoded<$Schema>,
  ___Keys extends HydratableConfigInput = HydratableConfigInput,
> {
  readonly [HydrationConfigSymbol]: Config

  // Dehydrated schema projection methods
  readonly makeDehydrated: MakeDehydratedFn<___Encoded, ___Keys>
  readonly dehydrate: DehydrateFn<___Decoded>
}

export type _Dehydrated<
  ___Encoded extends object,
  $Keys extends HydratableConfigInput,
> = Ob.Writeable<
  & DehydratedPropertiesStatic
  & Ob.OnlyKeysInArray<___Encoded, [...$Keys, EffectKit.Struct.TagPropertyName]>
>

export interface DehydratedPropertiesStatic {
  readonly _dehydrated: true
}

// ============================================================================
// Dehydrated Schema Projections
// ============================================================================

// Export type helper for consumers
export type Dehydrated<$Schema extends Hydratable> = $Schema extends Hydratable<infer __schema__, infer __keys__>
  ? _Dehydrated<EffectKit.Schema.ArgEncoded<__schema__>, any> // Using any to avoid constraint issues
  : never

/**
 * Schema projection for dehydrated form - like Effect's encodedSchema but for dehydrated
 */
export type DehydratedSchema<
  $Schema extends AnySchema,
  ___Keys extends HydratableConfigInput = HydratableConfigInput,
> = S.Schema<
  _Dehydrated<EffectKit.Schema.ArgEncoded<$Schema>, ___Keys>,
  _Dehydrated<EffectKit.Schema.ArgEncoded<$Schema>, ___Keys>
>

/**
 * Function type for makeDehydrated method - handles singleton vs keyed cases
 */
export type MakeDehydratedFn<
  $Encoded extends object,
  $ConfigKeys extends HydratableConfigInput,
> = $ConfigKeys extends readonly string[] ? $ConfigKeys['length'] extends 0 ? () => _Dehydrated<$Encoded, $ConfigKeys>
  : (keys: Ob.OnlyKeysInArray<$Encoded, [...$ConfigKeys]>) => _Dehydrated<$Encoded, $ConfigKeys>
  : never

/**
 * Function type for dehydrate method - dehydrates hydrated values
 */
export type DehydrateFn<___Decoded extends object> = (value: ___Decoded) => _Dehydrated<___Decoded, any>

/**
 * Extract hydration keys from a hydratable schema
 */
export type ArgKeys<$Hydratable> = $Hydratable extends Hydratable<any, infer __keys__> ? __keys__ : never

/**
 * Extract hydration keys from an AST at runtime
 * @param ast - The AST to extract keys from
 * @param tag - Optional tag for union schemas
 */
export const getHydrationKeys = (ast: AST.AST, tag?: string): readonly string[] => {
  const config = ast.annotations?.[HydrationConfigSymbol] as Config | undefined
  if (!config) return []

  return Match.value(config).pipe(
    Match.when({ _tag: 'HydratableConfigStruct' }, (c) => c.uniqueKeys),
    Match.when({ _tag: 'HydratableConfigAdt' }, (c) => tag ? c.memberKeys[tag] ?? [] : []),
    Match.when({ _tag: 'HydratableConfigSingleton' }, () => ['hash']), // Synthetic hash key
    Match.exhaustive,
  )
}

/**
 * Check if a hydratable is in singleton mode (no explicit keys)
 */
export const isSingleton = (ast: AST.AST): boolean => {
  const config = ast.annotations?.[HydrationConfigSymbol] as Config | undefined
  return config?._tag === 'HydratableConfigSingleton'
}

/**
 * Check if an AST represents a scalar type (can be hashed directly)
 */
const isScalarAST = (ast: AST.AST): boolean => {
  const resolved = EffectKit.Schema.AST.resolve(ast)
  return (
    resolved._tag === 'StringKeyword'
    || resolved._tag === 'NumberKeyword'
    || resolved._tag === 'BooleanKeyword'
    || resolved._tag === 'BigIntKeyword'
    || resolved._tag === 'SymbolKeyword'
  )
}

/**
 * Check if an AST represents a transformation with scalar encoding
 */
const hasScalarEncoding = (ast: AST.AST): boolean => {
  if (ast._tag === 'Transformation') {
    return isScalarAST(ast.from)
  }
  return false
}

/**
 * Validate that a schema is eligible for singleton mode
 */
const validateSingletonEligibility = (ast: AST.AST): void => {
  // Allow direct scalars or transformations with scalar encoding
  if (!isScalarAST(ast) && !hasScalarEncoding(ast)) {
    throw new Error(
      'Singleton hydratables require scalar types or transformations with scalar encoding. '
        + 'For complex types like structs, provide explicit keys.',
    )
  }
}

/**
 * Generate a hash for a singleton hydratable value
 * @param value - The value to hash
 * @param schema - The schema of the value
 * @returns The hash as a string
 */
export const generateSingletonHash = (value: unknown, schema: S.Schema.Any): string => {
  const ast = schema.ast

  // For transformations, encode to the scalar form first
  if (ast._tag === 'Transformation') {
    const encoded = ParseResult.encodeSync(schema as any)(value)
    return Hash.string(String(encoded)).toString()
  }

  // For direct scalars
  const resolved = EffectKit.Schema.AST.resolve(ast)
  switch (resolved._tag) {
    case 'StringKeyword':
      return Hash.string(value as string).toString()
    case 'NumberKeyword':
      return Hash.number(value as number).toString()
    case 'BooleanKeyword':
      return Hash.string(String(value)).toString()
    case 'BigIntKeyword':
      return Hash.string((value as bigint).toString()).toString()
    case 'SymbolKeyword':
      return Hash.string((value as symbol).toString()).toString()
    default:
      // Fallback - should not reach here if validation is correct
      return Hash.string(JSON.stringify(value)).toString()
  }
}

/**
 * Traverse an AST recursively, visiting each node
 */
const traverseAST = (ast: AST.AST, visit: (ast: AST.AST) => void): void => {
  switch (ast._tag) {
    case 'TypeLiteral':
      for (const ps of ast.propertySignatures) {
        visit(ps.type)
      }
      break

    case 'Union':
      for (const member of ast.types) {
        visit(member)
      }
      break

    case 'TupleType':
      for (const element of ast.elements) {
        if ('type' in element) visit(element.type)
      }
      for (const rest of ast.rest) {
        if ('type' in rest) visit(rest.type)
      }
      break

    case 'Suspend':
      visit(ast.f())
      break

    case 'Refinement':
      visit(ast.from)
      break

    case 'Transformation':
      visit(ast.from)
      // Optionally traverse 'to' side if needed
      // visit(ast.to)
      break

      // Other AST types don't need recursive traversal
  }
}

/**
 * Build an index of all hydratable AST nodes by tag
 */
export const buildASTIndex = (
  schema: S.Schema.Any,
): ASTIndex => {
  const index: ASTIndex = new Map()
  const visited = new Set<AST.AST>()

  function traverse(ast: AST.AST): void {
    // Avoid cycles
    if (visited.has(ast)) return
    visited.add(ast)

    // Check for hydration config
    const config = ast.annotations?.[HydrationConfigSymbol]

    if (config) {
      const typedConfig = config as Config

      // For transformations, check the 'to' side for type literal
      let astToCheck = ast
      if (AST.isTransformation(ast)) {
        astToCheck = ast.to
      }

      if (
        (typedConfig._tag === 'HydratableConfigStruct' || typedConfig._tag === 'HydratableConfigSingleton')
        && isTypeLiteral(astToCheck)
      ) {
        // Single tagged struct (regular or singleton)
        const tag = EffectKit.Schema.AST.extractTag(astToCheck)
        if (tag) index.set(tag, ast) // Store the original ast, not the checked one
      } else if (typedConfig._tag === 'HydratableConfigAdt') {
        // ADT union - add entry for each member tag
        for (const memberTag of Object.keys(typedConfig.memberKeys)) {
          index.set(memberTag, ast)
        }
      }
    }

    // Use our AST traversal utility
    traverseAST(ast, traverse)
  }

  traverse(schema.ast)
  return index
}

/**
 * @deprecated Use buildASTIndex instead
 */
export const buildSchemaIndex = buildASTIndex

// ============================================================================
// Schema Combinator
// ============================================================================

/**
 * Mark a schema as hydratable with specific keys
 *
 * @example
 * // Tagged struct
 * const User = Hydratable(
 *   S.TaggedStruct('User', { id: S.String, name: S.String }),
 *   { keys: ['id'] }
 * )
 *
 * // Union
 * const UserHydratable = Hydratable(
 *   S.Union(User, UserDehydrated),
 *   {
 *     keys: {
 *       User: ['id'],
 *       UserDehydrated: ['id']
 *     }
 *   }
 * )
 */
export function Hydratable<
  schema extends AnyStruct | AnyAdt | SingletonSchema,
  const $Options extends Options = OptionsWithDefualts,
>(
  schema: schema,
  options?: $Options,
): Hydratable<schema, $Options> {
  // For transformations, check the 'to' side
  let astToCheck = schema.ast
  if (AST.isTransformation(schema.ast)) {
    astToCheck = schema.ast.to
  }

  // Validate schema is tagged struct or union of tagged structs
  if (isTypeLiteral(astToCheck)) {
    const tag = EffectKit.Schema.AST.extractTag(astToCheck)
    if (!tag) throw new Error('Schema must be a tagged struct')
  } else if (isUnion(astToCheck)) {
    // Check all members are tagged structs
    for (const member of astToCheck.types) {
      if (!isTypeLiteral(member) || !EffectKit.Schema.AST.extractTag(member)) {
        throw new Error('Union members must be tagged structs')
      }
    }
  } else {
    throw new Error('Schema must be tagged struct or union of tagged structs')
  }

  // Build new config structure
  let config: Config

  if (isTypeLiteral(astToCheck)) {
    // Simple struct
    const keys = options?.keys ?? []

    // If no keys provided, enter singleton mode
    if (keys.length === 0) {
      // Validate eligibility for singleton mode (use original ast for validation)
      validateSingletonEligibility(schema.ast)
      config = HydratableConfigSingleton.make({})
    } else {
      config = HydratableConfigStruct.make({ uniqueKeys: keys })
    }
  } else {
    // Union - detect ADT
    const allTags = EffectKit.Schema.AST.extractTagsFromUnion(astToCheck)
    const unionAdt = EffectKit.Schema.UnionAdt.parse(allTags)

    if (unionAdt) {
      type MemberKeysIndex = Record<string, readonly string[]>
      const memberKeys: MemberKeysIndex = {}

      // Build memberKeys from options
      if (typeof options?.keys === 'object' && !Array.isArray(options.keys)) {
        Object.assign(memberKeys, options.keys)
      }

      // Check if any member has no keys (singleton mode not supported for unions yet)
      const hasEmptyKeys = Object.values(memberKeys).some(keys => keys.length === 0)
      if (hasEmptyKeys) {
        throw new Error('Singleton mode is not currently supported for union hydratables')
      }

      config = HydratableConfigAdt.make({ name: unionAdt.name, memberKeys })
    } else {
      throw new Error('Union must form a single ADT pattern')
    }
  }

  // Store in annotations
  const annotatedSchema = schema.annotations({
    [HydrationConfigSymbol]: config,
  })

  Object.defineProperty(annotatedSchema, 'makeDehydrated', {
    value: (keys?: any) => {
      return Value.makeDehydratedValue(config, annotatedSchema, keys)
    },
    writable: false,
    enumerable: false,
    configurable: false,
  })

  Object.defineProperty(annotatedSchema, 'dehydrate', {
    value: Value.dehydrate(annotatedSchema),
    writable: false,
    enumerable: false,
    configurable: false,
  })

  return annotatedSchema as any
}
