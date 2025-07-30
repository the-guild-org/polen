import type { Ob } from '#lib/kit-temp/$'
import { EffectKit } from '#lib/kit-temp/effect'
import { S } from '#lib/kit-temp/effect'
import { Match, ParseResult } from 'effect'
import * as AST from 'effect/SchemaAST'
import { isTypeLiteral, isUnion } from 'effect/SchemaAST'
import { type Options, type OptionsWithDefualts } from './options.js'

type AnyAdt = EffectKit.Schema.UnionAdt.$any
type AnyStruct = EffectKit.Schema.TaggedStruct.$any
type AnySchema = S.Schema<any, any, any>

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
  readonly ast: AST.AST
  readonly index: ASTIndex
  readonly encoders: EncodersMap
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
  const index = buildASTIndex(schema)
  const encoders = buildEncoders(index)
  return { ast: schema.ast, index, encoders }
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

export const Config = S.Union(HydratableConfigStruct, HydratableConfigAdt).annotations({
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
  if (!schema) return null
  const ast = (schema as any).ast
  if (!ast || typeof ast !== 'object') return null
  const annotations = ast.annotations
  if (!annotations || typeof annotations !== 'object') return null
  const config = annotations[HydrationConfigSymbol]
  return config || null
}

type HydratableConfigInput = Options.Keys

// ============================================================================
// Core
// ============================================================================

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
    Match.exhaustive,
  )
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
      if (typedConfig._tag === 'HydratableConfigStruct' && isTypeLiteral(ast)) {
        // Single tagged struct
        const tag = EffectKit.Schema.AST.extractTag(ast)
        if (tag) index.set(tag, ast)
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
  schema extends AnyStruct | AnyAdt,
  const $Options extends Options = OptionsWithDefualts,
>(
  schema: schema,
  options?: $Options,
): Hydratable<schema, $Options> {
  // Validate schema is tagged struct or union of tagged structs
  if (isTypeLiteral(schema.ast)) {
    const tag = EffectKit.Schema.AST.extractTag(schema.ast)
    if (!tag) throw new Error('Schema must be a tagged struct')
  } else if (isUnion(schema.ast)) {
    // Check all members are tagged structs
    for (const member of schema.ast.types) {
      if (!isTypeLiteral(member) || !EffectKit.Schema.AST.extractTag(member)) {
        throw new Error('Union members must be tagged structs')
      }
    }
  } else {
    throw new Error('Schema must be tagged struct or union of tagged structs')
  }

  // Build new config structure
  let config: Config

  if (isTypeLiteral(schema.ast)) {
    // Simple struct
    config = HydratableConfigStruct.make({ uniqueKeys: options?.keys ?? [] })
  } else {
    // Union - detect ADT
    const allTags = EffectKit.Schema.AST.extractTagsFromUnion(schema.ast)
    const unionAdt = EffectKit.Schema.UnionAdt.parse(allTags)

    if (unionAdt) {
      type MemberKeysIndex = Record<string, readonly string[]>
      const memberKeys: MemberKeysIndex = {}

      // Build memberKeys from options
      if (typeof options?.keys === 'object' && !Array.isArray(options.keys)) {
        Object.assign(memberKeys, options.keys)
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

  return annotatedSchema as any
}
