import { EffectKit, S } from '#lib/kit-temp/effect'
import type * as AST from 'effect/SchemaAST'
import { isTypeLiteral, isUnion } from 'effect/SchemaAST'
import { Hydratable } from '../hydratable/$.js'
import { Uhl } from '../uhl/$.js'
import { isDehydrated, type Located } from './value.js'

/**
 * Locate all hydratables in a value by traversing with AST
 * @param value - The value to search for hydratables
 * @param context - The hydration context containing ast, index, and encoders
 * @returns Array of located hydratables with their UHL paths
 */
export const locateHydratables = (
  value: unknown,
  context: Hydratable.Context,
): Located[] => {
  return locateHydratables_(value, context, [])
}

/**
 * Internal recursive implementation of locateHydratables
 */
const locateHydratables_ = (
  value: unknown,
  context: Hydratable.Context,
  parentUHL: Uhl.Uhl,
): Located[] => {
  const results: Located[] = []

  // Skip non-objects
  if (!value || typeof value !== 'object') return results

  // Check if this value is hydratable
  if (EffectKit.Struct.isTagged(value)) {
    const hydratableAST = context.index.get(value._tag)

    if (hydratableAST) {
      // This is a hydratable - build its UHL
      const uniqueKeys = Hydratable.getHydrationKeys(hydratableAST, value._tag)
      const isSingleton = Hydratable.isSingleton(hydratableAST)
      const keyValues: Hydratable.UniqueKeysMutable = {}

      if (isSingleton) {
        // For singleton hydratables, generate hash key
        const schema = S.make(hydratableAST)
        const hash = Hydratable.generateSingletonHash(value, schema)
        keyValues['hash'] = hash
      } else {
        // Extract unique key values in encoded form
        const encoder = context.encoders.get(value._tag)

        for (const key of uniqueKeys) {
          if (key in value) {
            // For each key, we need to check if it has a transformation
            // and encode it properly
            let keyValue = (value as any)[key]

            if (encoder) {
              try {
                // Encode the entire value and extract the key
                const encodedValue = encoder(value) as any
                if (key in encodedValue) {
                  keyValue = encodedValue[key]
                }
              } catch {
                // If encoding fails, use the raw value
              }
            }

            keyValues[key] = keyValue
          }
        }
      }

      // Check if it's part of an ADT
      // Create minimal schema wrapper to use getConfigMaybe
      const config = Hydratable.getConfigMaybe({ ast: hydratableAST })
      const adtName = config?._tag === 'HydratableConfigAdt' ? config.name : undefined

      const segment = Uhl.Segment.make({ tag: value._tag, uniqueKeys: keyValues, ...(adtName && { adt: adtName }) })
      const currentUHL = [...parentUHL, segment]

      results.push({ value, uhl: currentUHL })

      // Update parent UHL for children
      parentUHL = currentUHL
    }
  }

  // Traverse based on AST type
  const ast = context.ast
  if (isTypeLiteral(ast)) {
    // Traverse object properties
    for (const prop of ast.propertySignatures) {
      const propName = String(prop.name)
      if (propName === EffectKit.Struct.tagPropertyName) continue // Skip tag

      const propValue = (value as any)[propName]
      if (propValue !== undefined && propValue !== null) {
        results.push(...locateHydratables_(propValue, {
          ...context,
          ast: prop.type,
        }, parentUHL))
      }
    }
  } else if (isUnion(ast)) {
    // For unions, find matching member by tag
    if (EffectKit.Struct.isTagged(value)) {
      for (const member of ast.types) {
        if (isTypeLiteral(member)) {
          const memberTag = EffectKit.Schema.AST.extractTag(member)
          if (memberTag === value._tag) {
            results.push(...locateHydratables_(value, {
              ...context,
              ast: member,
            }, parentUHL))
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
          results.push(...locateHydratables_(element, {
            ...context,
            ast: elementAST,
          }, parentUHL))
        }
      }
    }
  }

  return results
}

/**
 * Locate only hydrated hydratables (exclude dehydrated ones)
 * @param value - The value to search for hydratables
 * @param context - The hydration context containing ast, index, and encoders
 * @returns Array of located hydratables (excluding dehydrated ones) with their UHL paths
 */
export const locateHydratedHydratables = (
  value: unknown,
  context: Hydratable.Context,
): Located[] => {
  return locateHydratables(value, context)
    .filter(located => !isDehydrated(located.value))
}
