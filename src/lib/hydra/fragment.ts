import { deeplyVisitHydratables } from '#lib/hydra/container'
import { EffectKit, S } from '#lib/kit-temp/effect'
import type * as AST from 'effect/SchemaAST'
import { isTypeLiteral, isUnion } from 'effect/SchemaAST'
import type { Container } from './container.js'
import { Hydratable } from './hydratable/$.js'
import { Uhl } from './uhl/$.js'
import type { Value } from './value/$.js'

export interface Fragment {
  readonly value: Value.Hydratable
  readonly uhl: Uhl.Uhl
}

export const fragmentsFromRootValue = (
  rootValue: Container,
  context: Hydratable.Context,
): Fragment[] => {
  const fragments: Fragment[] = []

  deeplyVisitHydratables(rootValue, context, (value, uhl) => {
    console.log('visit', uhl)
    fragments.push({
      value,
      uhl,
    })
  })

  // const fragment: Fragment = {
  //   uhl: Uhl.makeRoot(),
  //   value: rootValue as any,
  // }

  // fragments.push(fragment)

  // for (const value of Object.values(rootValue as any)) {
  //   fragments.push(..._fragmentsFromValue(value, context, fragment.uhl))
  // }

  return fragments
}

/**
 * Internal recursive implementation of locateHydratables
 */
const _fragmentsFromValue = (
  value: unknown,
  context: Hydratable.Context,
  parentUHL: Uhl.Uhl,
): Fragment[] => {
  const fragments: Fragment[] = []

  // Skip non-objects
  if (!value || typeof value !== 'object') return fragments

  // Check if this value is hydratable
  if (EffectKit.Struct.isTagged(value)) {
    const hydratableAST = context.astIndex.get(value._tag)

    if (hydratableAST) {
      // This is a hydratable - build its UHL
      const uniqueKeys = Hydratable.getHydrationKeys(hydratableAST, value._tag)
      const isSingleton = Hydratable.isSingleton(hydratableAST)
      const uniqueKeyValues: Hydratable.UniqueKeysMutable = {}

      if (isSingleton) {
        // For singleton hydratables, generate hash key
        const schema = S.make(hydratableAST)
        const hash = Hydratable.generateSingletonHash(value, schema)
        uniqueKeyValues['hash'] = hash
      } else {
        // Extract unique key values in encoded form
        const encoder = context.encodersIndex.get(value._tag)

        for (const key of uniqueKeys) {
          if (key in value) {
            // For each key, we need to check if it has a transformation
            // and encode it properly
            let keyValue = (value as any)[key]

            if (encoder) {
              // Encode the entire value and extract the key
              const encodedValue = encoder(value) as any
              if (key in encodedValue) {
                keyValue = encodedValue[key]
              }
            }

            uniqueKeyValues[key] = keyValue
          }
        }
      }

      // Check if it's part of an ADT
      // Create minimal schema wrapper to use getConfigMaybe
      const config = Hydratable.getConfigMaybe({ ast: hydratableAST })
      const adtName = config?._tag === 'HydratableConfigAdt' ? config.name : undefined

      const segment = Uhl.Segment.make({
        tag: value._tag,
        uniqueKeys: uniqueKeyValues,
        ...(adtName && { adt: adtName }),
      })

      // Build new UHL by extending the parent
      let currentUHL: Uhl.Uhl
      if (parentUHL._tag === 'UhlRoot') {
        // Parent is root, create a path with this segment
        currentUHL = Uhl.makePath(segment)
      } else {
        // Parent is already a path, extend it
        currentUHL = Uhl.makePath(...parentUHL.segments, segment)
      }

      fragments.push({ value, uhl: currentUHL })

      // Update parent UHL for children
      parentUHL = currentUHL
    }
  }

  // Traverse based on AST type
  const ast = context.originalSchema.ast
  if (isTypeLiteral(ast)) {
    // Traverse object properties
    for (const prop of ast.propertySignatures) {
      const propName = String(prop.name)
      if (propName === EffectKit.Struct.tagPropertyName) continue // Skip tag

      const propValue = (value as any)[propName]
      if (propValue !== undefined && propValue !== null) {
        // Create new context with updated originalSchema for the property
        const propSchema = S.make(prop.type)
        const propContext = { ...context, originalSchema: propSchema }
        fragments.push(..._fragmentsFromValue(propValue, propContext, parentUHL))
      }
    }
  } else if (isUnion(ast)) {
    // For unions, find matching member by tag
    if (EffectKit.Struct.isTagged(value)) {
      for (const member of ast.types) {
        if (isTypeLiteral(member)) {
          const memberTag = EffectKit.Schema.AST.extractTag(member)
          if (memberTag === value._tag) {
            // Create new context with updated originalSchema for the union member
            const memberSchema = S.make(member)
            const memberContext = { ...context, originalSchema: memberSchema }
            fragments.push(..._fragmentsFromValue(value, memberContext, parentUHL))
            break
          }
        }
      }
    }
  } else if (Array.isArray(value)) {
    // Handle arrays
    if (ast._tag === 'TupleType') {
      // Get element type
      let elementAST: AST.AST | undefined

      if (ast.elements.length > 0 && ast.elements[0] && 'type' in ast.elements[0]) {
        elementAST = ast.elements[0].type
      } else if (ast.rest.length > 0 && ast.rest[0]) {
        elementAST = ast.rest[0].type
      }

      if (elementAST) {
        for (const element of value) {
          // Create new context with updated originalSchema for the element
          const elementSchema = S.make(elementAST)
          const elementContext = { ...context, originalSchema: elementSchema }
          fragments.push(..._fragmentsFromValue(element, elementContext, parentUHL))
        }
      }
    }
  }

  return fragments
}
