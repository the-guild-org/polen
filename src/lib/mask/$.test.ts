import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Mask } from './$.ts'

describe('Mask.create', () => {
  test('boolean options create binary masks', () => {
    const showMask = Mask.create(true)
    const hideMask = Mask.create(false)

    expect(showMask.type).toBe('binary')
    expect(hideMask.type).toBe('binary')

    if (showMask.type === 'binary' && hideMask.type === 'binary') {
      expect(showMask.show).toBe(true)
      expect(hideMask.show).toBe(false)
    }
  })

  test('array options create allow mode properties mask', () => {
    const mask = Mask.create(['name', 'age'])

    expect(mask.type).toBe('properties')
    if (mask.type === 'properties') {
      expect(mask.mode).toBe('allow')
      expect(mask.properties).toEqual(['name', 'age'])
    }
  })

  test('object options create mode based on values', () => {
    const allowMask = Mask.create({ name: true, age: true, password: false })
    const denyMask = Mask.create({ password: false, secret: false })

    expect(allowMask.type).toBe('properties')
    expect(denyMask.type).toBe('properties')

    if (allowMask.type === 'properties' && denyMask.type === 'properties') {
      expect(allowMask.mode).toBe('allow')
      expect(allowMask.properties).toEqual(['name', 'age'])

      expect(denyMask.mode).toBe('deny')
      expect(denyMask.properties).toEqual(['password', 'secret'])
    }
  })
})

describe('Mask.apply', () => {
  test('binary masks show/hide data', () => {
    const data = { a: 1 }

    expect(Mask.apply(data, Mask.create(true))).toBe(data)
    expect(Mask.apply(data, Mask.create(false))).toBe(undefined)
  })

  test('properties masks filter objects', () => {
    const data = { name: 'John', age: 30, password: 'secret' }

    // Allow mode
    const allowMask = Mask.create(['name', 'age'])
    expect(Mask.apply(data, allowMask)).toEqual({ name: 'John', age: 30 })

    // Deny mode
    const denyMask = Mask.create({ password: false })
    expect(Mask.apply(data, denyMask)).toEqual({ name: 'John', age: 30 })
  })

  test('properties masks throw for non-objects', () => {
    const mask = Mask.create(['name'])

    expect(() => Mask.apply('string' as any, mask)).toThrow()
    expect(() => Mask.apply(123 as any, mask)).toThrow()
    expect(() => Mask.apply(null as any, mask)).toThrow()
  })
})

describe('apply variants', () => {
  test('applyPartial allows missing properties', () => {
    const mask = Mask.create<{ name: string; age: number }>(['name', 'age'])
    const partial = { name: 'John' }

    expect(Mask.applyPartial(partial, mask)).toEqual({ name: 'John' })
    expect(Mask.applyPartial({}, mask)).toEqual({})
  })

  test('applyExact works with any data for binary masks', () => {
    const showMask = Mask.create(true)
    const hideMask = Mask.create(false)

    expect(Mask.applyExact('hello' as any, showMask)).toBe('hello')
    expect(Mask.applyExact('hello' as any, hideMask)).toBe(undefined)
  })
})

describe('property-based tests', () => {
  test('binary masks - invariants', () => {
    fc.assert(
      fc.property(fc.anything(), (data) => {
        expect(Mask.apply(data, Mask.create(true))).toBe(data)
        expect(Mask.apply(data, Mask.create(false))).toBe(undefined)
      }),
    )
  })

  test('properties mask - allow mode filters correctly', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), fc.anything()),
        fc.array(fc.string(), { minLength: 1 }),
        (obj, keys) => {
          const mask = Mask.create(keys)
          const result = Mask.apply(obj as any, mask)
          const resultKeys = Object.keys(result as any)

          // Result contains only keys that were in both mask and object
          expect(resultKeys.every(key => keys.includes(key))).toBe(true)

          // All requested keys that exist in obj are in result
          keys.forEach(key => {
            if (key in obj) {
              expect(result).toHaveProperty(key, (obj as any)[key])
            }
          })
        },
      ),
    )
  })

  test('properties mask - deny mode filters correctly', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), fc.anything()),
        fc.uniqueArray(fc.string(), { minLength: 1 }),
        (data, keysToRemove) => {
          const maskSpec = Object.fromEntries(keysToRemove.map(k => [k, false]))
          const mask = Mask.create(maskSpec)

          expect(mask.type).toBe('properties')
          if (mask.type !== 'properties') return
          expect(mask.mode).toBe('deny')

          const result = Mask.apply(data as any, mask)

          // Result should not have any of the denied keys
          keysToRemove.forEach(key => {
            expect(Object.prototype.hasOwnProperty.call(result, key)).toBe(false)
          })

          // Result should have all other keys from data
          Object.keys(data).forEach(key => {
            if (!keysToRemove.includes(key)) {
              expect(Object.prototype.hasOwnProperty.call(result, key)).toBe(true)
              expect((result as any)[key]).toBe((data as any)[key])
            }
          })
        },
      ),
    )
  })

  test('undefined values are preserved', () => {
    fc.assert(
      fc.property(
        fc.record({
          a: fc.oneof(fc.anything(), fc.constant(undefined)),
          b: fc.oneof(fc.anything(), fc.constant(undefined)),
          c: fc.oneof(fc.anything(), fc.constant(undefined)),
        }),
        fc.shuffledSubarray(['a', 'b', 'c'], { minLength: 1 }),
        (obj, keys) => {
          const result = Mask.apply(obj as any, Mask.create(keys))

          keys.forEach(key => {
            if (key in obj) {
              expect(result).toHaveProperty(key)
              expect((result as any)[key]).toBe((obj as any)[key])
            }
          })
        },
      ),
    )
  })

  test('apply and applyPartial are consistent for complete data', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), fc.anything()),
        fc.array(fc.string(), { minLength: 1 }),
        (data, keys) => {
          const mask = Mask.create(keys)
          expect(Mask.apply(data as any, mask)).toEqual(Mask.applyPartial(data as any, mask))
        },
      ),
    )
  })

  test('non-objects throw with properties masks', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
        ),
        fc.array(fc.string(), { minLength: 1 }),
        (nonObject, keys) => {
          const mask = Mask.create(keys)
          expect(() => Mask.apply(nonObject as any, mask)).toThrow('Cannot apply properties mask to non-object data')
        },
      ),
    )
  })

  test('immutability invariants', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string(),
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
          ),
        ),
        fc.oneof(
          fc.boolean(),
          fc.array(fc.string()),
          fc.dictionary(fc.string(), fc.boolean()),
        ),
        (data, maskOptions) => {
          const mask = Mask.create(maskOptions as any)
          const originalData = { ...data }
          const originalMask = JSON.parse(JSON.stringify(mask))

          try {
            Mask.apply(data as any, mask)
          } catch {
            // Ignore errors for invalid combinations
          }

          expect(data).toEqual(originalData)
          expect(mask).toEqual(originalMask)
        },
      ),
    )
  })
})
