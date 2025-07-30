import { S } from '#lib/kit-temp/effect'
import type * as E from 'effect'
import type * as EAST from 'effect/SchemaAST'
import { isLiteral, isSuspend, isTransformation, isTypeLiteral } from 'effect/SchemaAST'

export type StringOrNever<$Type> = $Type extends string ? $Type : never

export { Schema as S } from 'effect'

export namespace EffectKit {
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

    /**
     * Delete all properties from an object except the tag property
     * Mutates the object in place
     */
    export const clearExceptTag = (obj: TaggedStruct): void => {
      for (const prop in obj) {
        if (prop !== tagPropertyName) {
          delete (obj as any)[prop]
        }
      }
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
    // todo: any real usecase for this? should we be just using S.All?
    export type $any = S.Schema<any, any, any>

    export type ArgDecoded<$Schema extends $any> = S.Schema.Type<$Schema>
    export type ArgEncoded<$Schema extends $any> = S.Schema.Encoded<$Schema>

    export namespace Tag {
      export type GetValue<$Tag extends S.tag<any>> = $Tag extends S.tag<infer __value__> ? __value__
        : never
    }

    export namespace Struct {
      export type $any = S.Struct<any>

      export type ExtractFields<
        $Struct extends S.Struct<any>,
      > = $Struct extends S.Struct<infer __fields__> ? __fields__ : never

      /**
       * Extract specific fields from a struct schema
       * Type-safe at input/output but implementation can cheat
       */
      export const extractFields = <
        $Fields extends S.Struct.Fields,
        $Keys extends ReadonlyArray<keyof $Fields>,
      >(
        schema: S.Struct<$Fields> | S.TaggedStruct<any, $Fields>,
        keys: $Keys,
      ): Pick<$Fields, $Keys[number]> => {
        const result = Object.fromEntries(
          keys.map(key => [key, schema.fields[key]]),
        )

        return result as Pick<$Fields, $Keys[number]>
      }
    }

    export namespace TaggedStruct {
      export type Tag = string

      export type $any = S.TaggedStruct<E.SchemaAST.LiteralValue, any>
      export type Any = S.TaggedStruct<any, any>

      export type Filter<
        $TaggedStruct extends $any,
        $PickedKeys extends keyof Struct.ExtractFields<$TaggedStruct>,
      > = $TaggedStruct extends S.TaggedStruct<infer __tag__, infer __structFields__>
        ? S.TaggedStruct<__tag__, Pick<__structFields__, $PickedKeys>>
        : never

      export type ArgTag<$Schema extends Schema.$any> = $Schema extends
        S.TaggedStruct<infer __tag__ extends EAST.LiteralValue, any> ? __tag__
        : never

      export type ArgTagString<$Schema extends Schema.$any> = StringOrNever<ArgTag<$Schema>>

      export type ArgFields<$Schema extends Any> = $Schema extends S.TaggedStruct<any, infer __fields__> ? __fields__
        : never

      export const getTagOrThrow = <schema extends Schema.$any>(
        schema: schema,
      ): ArgTagString<schema> => {
        // Resolve non-structural wrappers
        const resolved = AST.resolve(schema.ast)

        // Check if we reached a TypeLiteral (struct)
        if (!isTypeLiteral(resolved)) {
          throw new Error(
            `Expected to reach a TypeLiteral (struct) after traversing non-structural schemas, but got: ${resolved._tag}`,
          )
        }

        // Direct access: _tag is always first in TaggedStruct
        const tagProperty = resolved.propertySignatures[0]

        if (!tagProperty || tagProperty.name !== '_tag') {
          throw new Error('Expected _tag as first property in TaggedStruct')
        }

        // The _tag property's type should be a Literal
        const tagType = tagProperty.type

        if (!isLiteral(tagType)) {
          throw new Error('Expected Literal type for _tag property')
        }

        // Ensure the literal is a string
        if (typeof tagType.literal !== 'string') {
          throw new Error(`Expected tag to be a string literal, but got ${typeof tagType.literal}: ${tagType.literal}`)
        }

        return tagType.literal as any
      }
    }

    export namespace UnionAdt {
      export type $any = S.Union<TaggedStruct.$any[]>

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
      export type GetTags<$Union extends $any> = StringOrNever<
        Tag.GetValue<
          $Union['members'][number]['fields']['_tag']
        >
      >

      /**
       * Extract a specific member by its tag
       */
      export type ExtractMemberByTag<
        $Union extends S.Union<any>,
        $Tag extends GetTags<$Union>,
      > = Union.Arg.MembersAsUnion<$Union> extends infer __member__
        ? __member__ extends S.TaggedStruct<$Tag, any> ? S.Schema.Type<__member__>
        : never
        : never

      /**
       * Factory function type for creating union members
       */
      export type FnMake<$Union extends S.Union<any>> = <$Tag extends GetTags<$Union>>(
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
          const tag = TaggedStruct.getTagOrThrow(member)
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
      export const makeMake = <union extends S.Union<any>>(
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
       * Parse tags to detect ADTs.
       * Returns a Map of ADT names to ADT info.
       *
       * @deprecated Use parseADT instead which returns single ADT or null
       *
       * @example
       * parseADTs(['CatalogVersioned', 'CatalogUnversioned'])
       * // Map { 'Catalog' => { name: 'Catalog', members: [...] } }
       */
      export const parseADTs = (tags: string[]): Map<string, ADTInfo> => {
        const result = new Map<string, ADTInfo>()
        const adt = parse(tags)
        if (adt) {
          result.set(adt.name, adt)
        }
        return result
      }

      /**
       * Parse tags to detect if they form a single ADT.
       * Returns the ADT info if all tags follow one ADT pattern, null otherwise.
       *
       * @example
       * parseADT(['CatalogVersioned', 'CatalogUnversioned'])
       * // { name: 'Catalog', members: [...] }
       *
       * parseADT(['CatalogVersioned', 'User'])
       * // null (not an ADT - mixed patterns)
       */
      export const parse = (tags: string[]): ADTInfo | null => {
        if (tags.length < 2) return null // Need at least 2 members for an ADT

        // Parse all tags
        const parsedTags = tags.map(tag => ({
          tag,
          parsed: parseTag(tag),
        })).filter(item => item.parsed !== null) as Array<{
          tag: string
          parsed: NonNullable<ReturnType<typeof parseTag>>
        }>

        // If not all tags could be parsed, it's not an ADT
        if (parsedTags.length !== tags.length) return null

        // Check if all tags have the same ADT name
        const firstParsed = parsedTags[0]
        if (!firstParsed) return null

        const firstAdtName = firstParsed.parsed.adtName
        const allSameAdt = parsedTags.every(item => item.parsed.adtName === firstAdtName)

        if (!allSameAdt) return null

        // Build the ADT info
        const members = parsedTags.map(item => ({
          tag: item.tag,
          memberName: item.parsed.memberName,
        }))

        return {
          name: firstAdtName,
          members,
        }
      }

      /**
       * Check if a specific tag is an ADT member given all tags in the union.
       *
       * @example
       * isADTMember('CatalogVersioned', ['CatalogVersioned', 'CatalogUnversioned'])
       * // true
       */
      export const isADTMember = (tag: string, allTags: string[]): boolean => {
        const adt = parse(allTags)

        if (!adt) return false

        return adt.members.some((m: ADTMember) => m.tag === tag)
      }

      /**
       * Get ADT info for a specific tag.
       * Returns null if the tag is not an ADT member.
       */
      export const getADTInfo = (tag: string, allTags: string[]): { adtName: string; memberName: string } | null => {
        const adt = parse(allTags)

        if (!adt) return null

        const member = adt.members.find((m: ADTMember) => m.tag === tag)
        if (member) {
          return {
            adtName: adt.name,
            memberName: member.memberName,
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
      export type IsHasMemberTag<$Tag extends string, $S extends Schema.$any> = $S extends S.Schema<infer __union__>
        ? ParseTag<$Tag> extends { adtName: infer __adt__ extends string }
          ? CountADTMembers<__adt__, __union__> extends 0 ? false
          : CountADTMembers<__adt__, __union__> extends 1 ? false
          : true
        : false
        : false

      /**
       * Get ADT info from a tag within a schema.
       */
      export type GetMemberInfo<$Tag extends string, $S extends Schema.$any> = $S extends S.Schema<infer __union__>
        ? ParseTag<$Tag> extends { adtName: infer __adt__ extends string; memberName: infer __member__ extends string }
          ? CountADTMembers<__adt__, __union__> extends 0 ? never
          : CountADTMembers<__adt__, __union__> extends 1 ? never
          : { adtName: __adt__; memberName: __member__ }
        : never
        : never
    }

    export namespace Union {
      export type $any = S.Union<$any[]>
      export type $anyOfStructs = S.Union<Struct.$any[]>
      export namespace Arg {
        export type Members<$Union extends S.Union<any>> = $Union extends S.Union<infer __members__> ? __members__
          : never
        export type MembersAsUnion<$Union extends S.Union<any>> = Members<$Union>[number]
      }
    }

    export namespace AST {
      /**
       * Extract the tag value from a TypeLiteral AST with _tag field
       */
      export const extractTag = (ast: EAST.TypeLiteral): string | null => {
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
      export const collectTaggedMembers = (ast: EAST.Union): Map<string, EAST.TypeLiteral> => {
        const membersByTag = new Map<string, EAST.TypeLiteral>()

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

      // ============================================================================
      // Core Resolution
      // ============================================================================

      /**
       * Resolves an AST node to its underlying type, handling transformations and suspensions
       *
       * @param ast - The AST node to resolve
       * @returns The resolved AST node
       */
      export const resolve = (ast: EAST.AST): EAST.AST => {
        if (isTransformation(ast)) {
          return resolve(ast.from)
        }
        if (isSuspend(ast)) {
          return resolve(ast.f())
        }
        return ast
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
            const fieldAst = resolve(prop.type)
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
      export const extractPropertyKeys = (ast: EAST.TypeLiteral): string[] => {
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
        ast: EAST.TypeLiteral,
        propertyName: string | symbol,
      ): EAST.PropertySignature | undefined => {
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
        ast: EAST.TypeLiteral,
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
      export const getResolvedPropertyType = (
        ast: EAST.TypeLiteral,
        propertyName: string | symbol,
      ): EAST.AST | undefined => {
        const prop = getPropertySignature(ast, propertyName)
        if (!prop) return undefined
        return resolve(prop.type)
      }

      // ============================================================================
      // Union Operations
      // ============================================================================

      /**
       * Extracts all tags from a union
       */
      export const extractTagsFromUnion = (ast: EAST.Union): string[] => {
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
    }
  }
}
