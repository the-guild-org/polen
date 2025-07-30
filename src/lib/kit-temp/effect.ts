import type * as E from 'effect'
import type * as EffectSchemaAst from 'effect/SchemaAST'
import { isLiteral, isTypeLiteral } from 'effect/SchemaAST'

// export * as E from 'effect'
export { Schema as S } from 'effect'

export namespace EffectKit {
  /**
   * Extract field keys from a struct schema where the encoded type is primitive.
   * This is useful for hydration systems that need to know which fields can be
   * safely serialized as primitives.
   */
  // export type EncodedPrimitiveFieldKeys<$Fields extends E.Schema.Struct.Fields> = {
  //   [K in keyof $Fields]: E.Schema.Schema.Encoded<$Fields[K]> extends
  //     | string
  //     | number
  //     | boolean
  //     | bigint
  //     | null
  //     | undefined ? K
  //     : E.Schema.Schema.Encoded<$Fields[K]> extends Date ? K
  //     : never
  // }[keyof $Fields]

  export namespace Struct {
    export type StructTag = string

    export const tagPropertyName = '_tag'

    export type TagPropertyName = typeof tagPropertyName

    export type TaggedStruct = { [_ in TagPropertyName]: StructTag }

    export const isTagged = (
      value: unknown,
    ): value is TaggedStruct => {
      return typeof value === 'object' && value !== null && tagPropertyName in value
    }
  }
  export namespace Tag {
    export type PropertyName = '_tag'
  }

  export namespace TaggedStruct {
    /**
     * Omit the _tag field from a type
     */
    export type OmitTag<$T> = Omit<$T, Tag.PropertyName>
  }

  export namespace Schema {
    // todo: any real usecase for this? should we be just using E.Schema.All?
    export type $any = E.Schema.Schema<any, any, any>

    export type ArgDecoded<$Schema extends $any> = E.Schema.Schema.Type<$Schema>
    export type ArgEncoded<$Schema extends $any> = E.Schema.Schema.Encoded<$Schema>

    export namespace Tag {
      export type GetValue<$Tag extends E.Schema.tag<any>> = $Tag extends E.Schema.tag<infer __value__> ? __value__
        : never
    }

    export namespace Struct {
      export type $any = E.Schema.Struct<any>

      export type ExtractFields<
        $Struct extends E.Schema.Struct<any>,
      > = $Struct extends E.Schema.Struct<infer __fields__> ? __fields__ : never

      /**
       * Extract specific fields from a struct schema
       * Type-safe at input/output but implementation can cheat
       */
      export const extractFields = <
        $Fields extends E.Schema.Struct.Fields,
        $Keys extends ReadonlyArray<keyof $Fields>,
      >(
        schema: E.Schema.Struct<$Fields> | E.Schema.TaggedStruct<any, $Fields>,
        keys: $Keys,
      ): Pick<$Fields, $Keys[number]> => {
        const result = Object.fromEntries(
          keys.map(key => [key, schema.fields[key]]),
        )

        return result as Pick<$Fields, $Keys[number]>
      }
    }

    export namespace TaggedStruct {
      export type $any = E.Schema.TaggedStruct<E.SchemaAST.LiteralValue, any>

      export type Filter<
        $TaggedStruct extends $any,
        $PickedKeys extends keyof Struct.ExtractFields<$TaggedStruct>,
      > = $TaggedStruct extends E.Schema.TaggedStruct<infer __tag__, infer __structFields__>
        ? E.Schema.TaggedStruct<__tag__, Pick<__structFields__, $PickedKeys>>
        : never

      export type Any = E.Schema.TaggedStruct<any, any>

      export type ArgTag<$Schema extends Any> = $Schema extends E.Schema.TaggedStruct<infer __tag__, any> ? __tag__
        : never

      export type ArgFields<$Schema extends Any> = $Schema extends E.Schema.TaggedStruct<any, infer __fields__>
        ? __fields__
        : never

      export const getTag = <$Tag extends EffectSchemaAst.LiteralValue>(
        schema: E.Schema.TaggedStruct<$Tag, any>,
      ): $Tag => {
        if (!isTypeLiteral(schema.ast)) {
          throw new Error('Expected TypeLiteral AST for TaggedStruct')
        }

        // Direct access: _tag is always first in TaggedStruct
        const tagProperty = schema.ast.propertySignatures[0]

        if (!tagProperty || tagProperty.name !== '_tag') {
          throw new Error('Expected _tag as first property in TaggedStruct')
        }

        // The _tag property's type should be a Literal
        const tagType = tagProperty.type

        if (!isLiteral(tagType)) {
          throw new Error('Expected Literal type for _tag property')
        }

        return tagType.literal as $Tag
      }
    }

    export namespace UnionAdt {
      export type $any = E.Schema.Union<TaggedStruct.$any[]>

      // ============================================================================
      // ADT Detection Types
      // ============================================================================

      export interface ADTInfo {
        name: string
        members: ADTMember[]
      }

      export interface ADTMember {
        tag: string
        memberName: string
      }
      /**
       * Extract all tag values from a union of tagged structs
       */
      export type GetTags<$Union extends $any> = Tag.GetValue<
        $Union['members'][number]['fields']['_tag']
      >

      /**
       * Extract a specific member by its tag
       */
      export type ExtractMemberByTag<
        $Union extends E.Schema.Union<any>,
        $Tag extends GetTags<$Union>,
      > = Union.Arg.MembersAsUnion<$Union> extends infer __member__
        ? __member__ extends E.Schema.TaggedStruct<$Tag, any> ? E.Schema.Schema.Type<__member__>
        : never
        : never

      /**
       * Factory function type for creating union members
       */
      export type FnMake<$Union extends E.Schema.Union<any>> = <$Tag extends GetTags<$Union>>(
        tag: $Tag,
        fields: EffectKit.TaggedStruct.OmitTag<ExtractMemberByTag<$Union, $Tag>>,
      ) => ExtractMemberByTag<$Union, $Tag>

      /**
       * Type-safe collection of tagged struct members from a union schema
       * Returns a map where keys are inferred tag literals
       */
      export const collectMembersByTag = <
        $Union extends $any,
      >(
        union: $Union,
      ): Map<GetTags<$Union>, Union.Arg.MembersAsUnion<$Union>> => {
        const membersByTag = new Map<E.SchemaAST.LiteralValue, TaggedStruct.$any>()

        for (const member of union.members) {
          const tag = TaggedStruct.getTag(member)
          membersByTag.set(tag, member)
        }

        return membersByTag as any
      }

      /**
       * Create a factory function for a discriminated union.
       *
       * @example
       * ```typescript
       * const MyUnion = Schema.Union(
       *   Schema.TaggedStruct('TypeA', { value: Schema.String }),
       *   Schema.TaggedStruct('TypeB', { count: Schema.Number })
       * )
       *
       * const make = EffectKit.Schema.Union.make(MyUnion)
       *
       * // Type-safe member creation
       * const a = make('TypeA', { value: 'hello' }) // TypeA
       * const b = make('TypeB', { count: 42 })      // TypeB
       * ```
       */
      export const makeMake = <union extends E.Schema.Union<any>>(
        union: union,
      ): FnMake<union> => {
        const membersByTag = collectMembersByTag(union)

        // Return the factory function
        return ((tag: any, fields: any) => {
          const memberSchema = membersByTag.get(tag)
          if (!memberSchema) {
            throw new Error(`Unknown tag: ${tag}`)
          }
          // Use the member's make function with the tag added
          return memberSchema.make({ _tag: tag, ...fields })
        }) as any
      }

      // ============================================================================
      // ADT Detection Functions
      // ============================================================================

      /**
       * Parse all tags to detect ADTs.
       * Returns a map of ADT names to their member information.
       *
       * @example
       * parseADTs(['CatalogVersioned', 'CatalogUnversioned', 'User'])
       * // Map { 'Catalog' => { name: 'Catalog', members: [...] } }
       */
      export const parseADTs = (tags: string[]): Map<string, ADTInfo> => {
        const adts = new Map<string, ADTInfo>()

        // Group tags by potential ADT prefix
        const groups = new Map<string, string[]>()

        for (const tag of tags) {
          const parsed = parseTag(tag)
          if (parsed) {
            const existing = groups.get(parsed.adtName) ?? []
            existing.push(tag)
            groups.set(parsed.adtName, existing)
          }
        }

        // Only keep groups with 2+ members (actual ADTs)
        for (const [adtName, memberTags] of groups) {
          if (memberTags.length >= 2) {
            const members = memberTags.map(tag => {
              const parsed = parseTag(tag)!
              return {
                tag,
                memberName: parsed.memberName,
              }
            })

            adts.set(adtName, {
              name: adtName,
              members,
            })
          }
        }

        return adts
      }

      /**
       * Check if a specific tag is an ADT member given all tags in the union.
       *
       * @example
       * isADTMember('CatalogVersioned', ['CatalogVersioned', 'CatalogUnversioned'])
       * // true
       */
      export const isADTMember = (tag: string, allTags: string[]): boolean => {
        const adts = parseADTs(allTags)

        for (const adt of adts.values()) {
          if (adt.members.some((m: ADTMember) => m.tag === tag)) {
            return true
          }
        }

        return false
      }

      /**
       * Get ADT info for a specific tag.
       * Returns null if the tag is not an ADT member.
       */
      export const getADTInfo = (tag: string, allTags: string[]): { adtName: string; memberName: string } | null => {
        const adts = parseADTs(allTags)

        for (const adt of adts.values()) {
          const member = adt.members.find((m: ADTMember) => m.tag === tag)
          if (member) {
            return {
              adtName: adt.name,
              memberName: member.memberName,
            }
          }
        }

        return null
      }

      // ============================================================================
      // Helper Functions
      // ============================================================================

      /**
       * Parse a single tag to extract potential ADT structure.
       * This does NOT verify if it's actually part of an ADT.
       *
       * @example
       * parseTag('CatalogVersioned') // { adtName: 'Catalog', memberName: 'Versioned' }
       * parseTag('User') // null
       */
      const parseTag = (tag: string): { adtName: string; memberName: string } | null => {
        // Must start with uppercase
        if (!/^[A-Z]/.test(tag)) {
          return null
        }

        // Match pattern: Capital + lowercase letters, then Capital + any letters
        const match = tag.match(/^([A-Z][a-z]+)([A-Z][a-zA-Z]+)$/)

        if (!match) {
          return null
        }

        const [, adtName, memberName] = match

        // Check if we got valid matches
        if (!adtName || !memberName) {
          return null
        }

        // Suffix must have at least one lowercase to be valid camelCase
        if (!/[a-z]/.test(memberName)) {
          return null
        }

        return { adtName, memberName }
      }

      /**
       * Format an ADT tag from components.
       */
      export const formatADTTag = (adtName: string, memberName: string): string => {
        return `${adtName}${memberName}`
      }

      // ============================================================================
      // Type-Level Utilities
      // ============================================================================

      /**
       * Type-level version of parseTag
       */
      export type ParseTag<$Tag extends string> = $Tag extends `${infer __adtName__}${infer __memberName__}`
        ? __adtName__ extends `${infer __first__}${infer __rest__}`
          ? __first__ extends Capitalize<__first__>
            ? __rest__ extends `${Lowercase<__rest__>}${string}`
              ? __memberName__ extends `${infer __first2__}${infer __rest2__}`
                ? __first2__ extends Capitalize<__first2__>
                  ? __rest2__ extends
                    `${string}${Lowercase<string>}${string}` | `${Lowercase<string>}${string}` | Lowercase<string>
                    ? { adtName: __adtName__; memberName: __memberName__ }
                  : never
                : never
              : never
            : never
          : never
        : never
        : never

      /**
       * Convert ADT name to path (PascalCase to kebab-case)
       */
      export type ADTNameToPath<$Name extends string> = Lowercase<$Name>

      /**
       * Convert member name to path (PascalCase to kebab-case)
       */
      export type MemberNameToPath<$Name extends string> = Lowercase<$Name>

      /**
       * Extract all tags from a union type.
       */
      export type ExtractTags<$T> = $T extends { _tag: infer __tag__ extends string } ? __tag__ : never

      /**
       * Count members with a specific ADT prefix in a union.
       */
      type CountADTMembers<$ADTName extends string, $Union> =
        [Extract<$Union, { _tag: `${$ADTName}${string}` }>] extends [never] ? 0
          : [Extract<$Union, { _tag: `${$ADTName}${string}` }>] extends [infer __first__]
            ? [Exclude<Extract<$Union, { _tag: `${$ADTName}${string}` }>, __first__>] extends [never] ? 1
            : 2 // 2+ members
          : 0

      /**
       * Check if a tag is an ADT member within a schema.
       */
      export type IsHasMemberTag<$Tag extends string, $S extends Schema.$any> = $S extends
        E.Schema.Schema<infer __union__>
        ? ParseTag<$Tag> extends { adtName: infer __adt__ extends string }
          ? CountADTMembers<__adt__, __union__> extends 0 ? false
          : CountADTMembers<__adt__, __union__> extends 1 ? false
          : true
        : false
        : false

      /**
       * Get ADT info from a tag within a schema.
       */
      export type GetMemberInfo<$Tag extends string, $S extends Schema.$any> = $S extends
        E.Schema.Schema<infer __union__>
        ? ParseTag<$Tag> extends { adtName: infer __adt__ extends string; memberName: infer __member__ extends string }
          ? CountADTMembers<__adt__, __union__> extends 0 ? never
          : CountADTMembers<__adt__, __union__> extends 1 ? never
          : { adtName: __adt__; memberName: __member__ }
        : never
        : never
    }

    export namespace Union {
      export type $any = E.Schema.Union<$any[]>
      export type $anyOfStructs = E.Schema.Union<Struct.$any[]>
      export namespace Arg {
        export type Members<$Union extends E.Schema.Union<any>> = $Union extends E.Schema.Union<infer __members__>
          ? __members__
          : never
        export type MembersAsUnion<$Union extends E.Schema.Union<any>> = Members<$Union>[number]
      }
    }

    export namespace AST {
      /**
       * Extract the tag value from a TypeLiteral AST with _tag field
       */
      export const extractTag = (ast: EffectSchemaAst.TypeLiteral): string | null => {
        const tagProp = ast.propertySignatures.find(
          (p: any) => p.name === '_tag' && isLiteral(p.type),
        )

        if (!tagProp || !isLiteral(tagProp.type)) {
          return null
        }

        const literal = (tagProp.type as any).literal
        return typeof literal === 'string' ? literal : null
      }

      /**
       * Collect all tagged members from a union AST into a map keyed by tag
       */
      export const collectTaggedMembers = (ast: EffectSchemaAst.Union): Map<string, EffectSchemaAst.TypeLiteral> => {
        const membersByTag = new Map<string, EffectSchemaAst.TypeLiteral>()

        for (const member of ast.types) {
          if (isTypeLiteral(member)) {
            const tag = extractTag(member)
            if (tag) {
              membersByTag.set(tag, member)
            }
          }
        }

        return membersByTag
      }
    }
  }

  // export namespace Vitest {
  //   export interface MethodsNonLiveEnhanced<$R = never, $ExcludeTestServices extends boolean = false>
  //     extends EffectVitest.Vitest.MethodsNonLive<$R, $ExcludeTestServices>
  //   {
  //     //
  //     // Enhancements
  //     //
  //     effect$: <A, E>(
  //       name: string,
  //       effect: ReturnType<Parameters<this['effect']>[1]>,
  //       timeout?: number | V.TestOptions,
  //     ) => void
  //     //
  //     // Enhancements Recursion
  //     // Note only change below from core is to be using 'MethodsNonLiveEnhanced'
  //     //
  //     readonly layer: <R2, E>(layer: Layer.Layer<R2, E, R>, options?: {
  //       readonly timeout?: E.Duration.DurationInput
  //     }) => MakeLayerTestSuiteOverloaded<$R | R2, $ExcludeTestServices>
  //   }

  //   export type MakeLayerTestSuiteOverloaded<$R = never, $ExcludeTestServices extends boolean = false> = {
  //     (f: CallbackMethodsNonLiveEnhanced<$R, $ExcludeTestServices>): void
  //     (name: string, f: CallbackMethodsNonLiveEnhanced<$R, $ExcludeTestServices>): void
  //   }
  //   export type MakeLayerTestSuite<$R = never, $ExcludeTestServices extends boolean = false> = (
  //     ...args: [CallbackMethodsNonLiveEnhanced] | [string, CallbackMethodsNonLiveEnhanced]
  //   ) => void

  //   export type CallbackMethodsNonLiveEnhanced<$R = never, $ExcludeTestServices extends boolean = false> = (
  //     it: MethodsNonLiveEnhanced<$R, $ExcludeTestServices>,
  //   ) => void

  //   /**
  //    * Enhanced layer function that adds inline generator methods to the test API.
  //    *
  //    * Instead of:
  //    * ```ts
  //    * it.effect('test', () => Effect.gen(function*() { ... }))
  //    * ```
  //    *
  //    * You can write:
  //    * ```ts
  //    * it.effectInline('test', function*() { ... })
  //    * ```
  //    */
  //   export const layerEnhanced: MethodsNonLiveEnhanced['layer'] = (...layerEnhancedArgs) => {
  //     const [baseLayer, parentOptions] = layerEnhancedArgs

  //     const enhanceIt = (it: EffectVitest.Vitest.MethodsNonLive): MethodsNonLiveEnhanced => {
  //       const effect$: MethodsNonLiveEnhanced['effect$'] = (name, gen, timeout) =>
  //         it.effect(name, () => Effect.gen(gen as any), timeout)

  //       // Create a bound layer function that preserves parent options
  //       const enhancedLayer: MethodsNonLiveEnhanced['layer'] = (nestedLayer, nestedOptions) => {
  //         // We need to pass parent options to maintain memoMap and excludeTestServices
  //         // even though the type only shows timeout option
  //         const mergedOptions = {
  //           ...parentOptions,
  //           ...nestedOptions,
  //         } as any
  //         return layerEnhanced(nestedLayer, mergedOptions)
  //       }

  //       const methodsNonLiveEnhanced = {
  //         ...it,
  //         effect$,
  //         layer: enhancedLayer,
  //       } as any as MethodsNonLiveEnhanced
  //       return methodsNonLiveEnhanced as any
  //     }

  //     const makeLayerTestSuiteWrapper: MakeLayerTestSuite = (...args) => {
  //       if (args.length === 1) {
  //         return it.layer(...layerEnhancedArgs)((it) => args[0](enhanceIt(it)))
  //       } else {
  //         return it.layer(...layerEnhancedArgs)(args[0], (it) => args[1](enhanceIt(it)))
  //       }
  //     }

  //     return makeLayerTestSuiteWrapper as any
  //   }
  // }
}
