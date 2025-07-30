import type { AnyAdt, AnySchema, AnyStruct } from '#lib/hydra/types'
import type { Ob } from '#lib/kit-temp/$'
import { EffectKit } from '#lib/kit-temp/effect'
import { S } from '#lib/kit-temp/effect'
import type { Arr } from '@wollybeard/kit'
import type { ReadonlyRecord } from 'effect/Record'
import type { SimplifyDeep } from 'type-fest'

// ============================================================================
// Options
// ============================================================================

export interface Options<
  $Keys extends Options.Keys = Options.Keys,
> {
  keys?: $Keys
}

export interface OptionsWithDefualts<
  $Keys extends Options.Keys = Options.KeysDefaut,
> {
  keys?: $Keys
}

export namespace Options {
  export type Key = string
  export type Keys = readonly Key[]
  export type KeysGiven = readonly [Key, ...readonly Key[]]

  export type KeysEmpty = readonly []
  export type KeysDefaut = KeysEmpty

  export type WithKeysAsStruct = { readonly keys: Keys }
  export type WithKeysAsAdt = { readonly keys: ReadonlyRecord<string, Keys> }

  export type WithKeysGiven = WithKeysGivenAsAdt | WithKeysGivenAsStruct
  export type WithKeysGivenAsStruct = { readonly keys: Options.KeysGiven }
  // @claude is there a non conditional type here to say NON EMPTY?
  export type WithKeysGivenAsAdt = { keys: Record<string, KeysGiven> }

  // dprint-ignore
  export type ReadKeysGivenOrDefault<$Options extends Options> =
    [ReadKeysGiven<$Options>] extends [never] ? KeysDefaut : ReadKeysGiven<$Options>

  // dprint-ignore
  export type ReadKeysGiven<$Options extends Options> =
  $Options extends WithKeysGivenAsStruct
    ? $Options['keys']
    : $Options extends WithKeysGivenAsAdt
      ? Ob.Values<$Options['keys']>
      : never

  export type KeyValue = string | number

  export type InferParameter<
    $S extends EffectKit.Schema.$any,
  > = SimplifyDeep<{
    keys?: InferParameterPropertyKeys<$S>
  }>

  export type InferParameterPropertyKeys<
    $Schema extends EffectKit.Schema.$any,
    ___Encoded extends object = S.Schema.Encoded<$Schema>,
  > = $Schema extends AnyAdt ? _ForAdt<$Schema>
    : $Schema extends EffectKit.Schema.TaggedStruct.$any ? _ForStruct<$Schema>
    : never

  export type _ForAdt<
    $S extends AnyAdt,
  > = Arr.ReduceWithIntersection<_ForAdt_<EffectKit.Schema.Union.Arg.Members<$S>>>

  export type _ForAdt_<
    $Members extends ReadonlyArray<EffectKit.Schema.TaggedStruct.$any>,
  > = {
    [i in keyof $Members]: {
      [k in EffectKit.Schema.TaggedStruct.ArgTag<$Members[i]> & PropertyKey]: _ForStruct<
        $Members[i]
      >
    }
  }

  export type _ForStruct<
    $S extends AnyStruct,
    ___Encoded extends object = EffectKit.Schema.ArgEncoded<$S>,
    ___CandidateObject extends object = PickUniqueKeysCandidate<___Encoded>,
  > = keyof ___CandidateObject extends never ? readonly [] : Ob.KeysReadonlyArray<___CandidateObject>

  export type PickUniqueKeysCandidate<$Encoded extends object> = EffectKit.TaggedStruct.OmitTag<
    Ob.PickWhereValueExtends<$Encoded, KeyValue>
  >
}

// ============================================================================
// Core
// ============================================================================

/**
 * Enhanced schema interface that tracks hydration keys at type level
 */
export type Hydratable<
  $Schema extends AnySchema = AnySchema,
  $Options extends Options = OptionsWithDefualts,
> = $Schema & HydratableProperties<$Schema, $Options>

export interface HydratableProperties<
  $Schema extends AnySchema,
  $Options extends Options,
  ___Decoded extends object = EffectKit.Schema.ArgDecoded<$Schema>,
  ___Encoded extends object = EffectKit.Schema.ArgEncoded<$Schema>,
  ___Keys extends Config = Options.ReadKeysGivenOrDefault<$Options>,
> {
  readonly [HydrationConfigSymbol]: ___Keys
  readonly makeDehydrated: (
    ...parameters: _MakeDehydratedParametersUsingKeys<___Encoded, ___Keys>
  ) => _Dehydrated<___Encoded, ___Keys>
  readonly dehydrate: (value: ___Decoded) => _Dehydrated<___Encoded, ___Keys>
}

type Config = Options.Keys

// dprint-ignore
export type _MakeDehydratedParametersUsingKeys<
  ___Encoded extends object,
  $Keys extends Config,
> =  $Keys extends Options.KeysGiven
? [uniqueFields: Ob.OnlyKeysInArray<___Encoded, $Keys>]
: []

export type _Dehydrated<
  ___Encoded extends object,
  $Keys extends Config,
> = Ob.Writeable<
  & DehydratedPropertiesStatic
  & Ob.OnlyKeysInArray<___Encoded, [...$Keys, EffectKit.Struct.TagPropertyName]>
>

export interface DehydratedPropertiesStatic {
  readonly _dehydrated: true
}

/**
 * Symbol for tracking hydration keys at type and runtime level
 */
export const HydrationConfigSymbol = Symbol.for('@hydra/keys')

type HydrationConfigSymbol = typeof HydrationConfigSymbol

export type GetConfig<$Hydratable extends Hydratable> = $Hydratable[HydrationConfigSymbol]

export const getConfig = <hydratable_>(
  hydratable: hydratable_,
): hydratable_ extends Hydratable ? GetConfig<hydratable_> : never => {
  return (hydratable as any)[HydrationConfigSymbol] as any
}

/**
 * Extract hydration keys from a hydratable schema
 */
export type ArgKeys<$Hydratable> = $Hydratable extends Hydratable<any, infer __keys__> ? __keys__ : never

// ============================================================================
// Runtime Utilities
// ============================================================================

/**
 * Extract hydration keys from a schema at runtime
 * @param schema - The schema to extract keys from
 * @param tag - Optional tag for union schemas
 */
export const getHydrationKeys = (schema: S.Schema.Any, tag?: string): readonly string[] => {
  // Try to get annotation from schema first, then from AST
  const schemaAnnotation = (schema as any).annotations?.[HydrationConfigSymbol]
  const astAnnotation = (schema.ast as any).annotations?.[HydrationConfigSymbol]
  const annotation = typeof schemaAnnotation === 'function' ? astAnnotation : (schemaAnnotation || astAnnotation)

  if (!annotation) return []

  // If annotation is an object (union) and tag is provided
  if (typeof annotation === 'object' && !Array.isArray(annotation) && tag) {
    return annotation[tag] ?? []
  }

  // If annotation is an array (tagged struct)
  if (Array.isArray(annotation)) {
    return annotation
  }

  return []
}

/**
 * Check if a value is dehydrated
 */
export const isDehydrated = (value: unknown): value is { _dehydrated: true } => {
  return typeof value === 'object' && value !== null && '_dehydrated' in value && value._dehydrated === true
}

// ============================================================================
// Dehydration Operations
// ============================================================================

/**
 * Create a dehydrator function for specific keys
 */
export const makeDehydrator = <$T extends { _tag: string }>(
  keys: readonly string[],
) =>
(value: $T): any => {
  const result: any = { _tag: value._tag, _dehydrated: true }

  for (const key of keys) {
    if (key in value) {
      result[key] = (value as any)[key]
    }
  }

  return result
}

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
  schema extends AnyStruct,
  const $Options extends Options = OptionsWithDefualts,
>(
  schema: schema,
  options?: $Options,
): Hydratable<schema, $Options>

export function Hydratable<
  schema extends AnyAdt,
  const $Options extends OptionsWithDefualts,
>(
  schema: schema,
  options?: $Options,
): Hydratable<schema, $Options>

export function Hydratable(
  schema: S.Schema.Any,
  options?: { keys?: readonly string[] | Record<string, readonly string[]> },
): any {
  // Determine the keys value - default to empty array for tagged structs
  const keys = options?.keys ?? (schema.ast._tag === 'TypeLiteral' ? [] : undefined)

  // Add hydration keys to annotations
  const annotatedSchema = schema.annotations({
    [HydrationConfigSymbol]: keys,
  })

  // For tagged struct schemas, add makeDehydrated and dehydrate methods
  if (schema.ast._tag === 'TypeLiteral' && (Array.isArray(keys) || keys === undefined)) {
    const tag = EffectKit.Schema.AST.extractTag(schema.ast)
    if (!tag) {
      throw new Error('Cannot extract tag from schema - ensure it is a TaggedStruct')
    }

    const normalizedKeys = (keys ?? []) as readonly string[]
    const encoder = S.encodeSync(annotatedSchema as S.Schema<any, any, never>)

    // Create makeDehydrated function
    let makeDehydrated: any
    if (normalizedKeys.length === 0) {
      makeDehydrated = () => ({ _tag: tag, _dehydrated: true })
    } else {
      makeDehydrated = (input: any) => {
        const result: any = { _tag: tag, _dehydrated: true }

        // For makeDehydrated, we expect the input to already contain
        // the unique keys in their encoded form
        for (const key of normalizedKeys) {
          if (key in input) {
            result[key] = input[key]
          }
        }

        return result
      }
    }

    // Create dehydrate function
    const dehydrate = (value: any) => {
      // Check if already dehydrated
      if (isDehydrated(value)) {
        return value
      }

      // Create dehydrated value with encoded keys
      const result: any = { _tag: tag, _dehydrated: true }

      if (normalizedKeys.length > 0) {
        // Encode the value to get keys in encoded form
        const encoded = encoder(value)

        for (const key of normalizedKeys) {
          if (key in encoded) {
            result[key] = encoded[key]
          }
        }
      }

      return result
    }

    // Return schema with added methods
    // Object.assign preserves the prototype chain, so .make and other methods remain available
    return Object.assign(annotatedSchema, {
      makeDehydrated,
      dehydrate,
      [HydrationConfigSymbol]: normalizedKeys,
    })
  }

  return annotatedSchema
}
