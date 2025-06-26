import { type ExtendsExact, objPolicyFilter } from '#lib/kit-temp'
import { Obj } from '@wollybeard/kit'
import { never } from '@wollybeard/kit/language'
import type { GetDataType, Mask } from './mask.ts'

/**
 * Type-level function that applies a mask to data.
 *
 * @template Data - The data type
 * @template M - The mask type
 *
 * Binary masks:
 * - show=true returns the data unchanged
 * - show=false returns undefined
 *
 * Properties masks:
 * - 'allow' mode returns Pick<Data, keys>
 * - 'deny' mode returns Omit<Data, keys>
 * - Non-objects throw an error at runtime
 */
// dprint-ignore
export type Apply<Data, M extends Mask> =
    M extends { type: `binary`, show: boolean }
      ? M[`show`] extends true
        ? Data
        : undefined
      : M extends { type: `properties`, mode: string, properties: any[] }
        ? Data extends object
          ? M[`mode`] extends `allow`
            ? Pick<Data, Extract<M[`properties`][number], keyof Data>>
            : Omit<Data, Extract<M[`properties`][number], keyof Data>>
          : never  // Non-objects not allowed with property masks
        : never

/**
 * Apply mask to data with standard covariance.
 *
 * Data must be assignable to the mask's expected type (may have excess properties).
 *
 * @param data - The data to mask
 * @param mask - The mask to apply
 * @returns The masked data
 *
 * @example
 * ```ts
 * const user = { name: 'John', email: 'john@example.com', password: 'secret' }
 * const mask = Mask.pick<User>(['name', 'email'])
 * const safeUser = apply(user, mask) // { name: 'John', email: 'john@example.com' }
 * ```
 */
export const apply = <
  data extends GetDataType<mask>,
  mask extends Mask,
>(data: data, mask: mask): Apply<data, mask> => {
  return applyInternal(data, mask) as Apply<data, mask>
}

/**
 * Apply mask to partial data.
 *
 * Data may have only a subset of the mask's expected properties.
 * Useful when working with incomplete data or optional fields.
 *
 * @param data - The partial data to mask
 * @param mask - The mask to apply
 * @returns The masked data
 *
 * @example
 * ```ts
 * const partialUser = { name: 'John' } // missing email
 * const mask = Mask.pick<User>(['name', 'email'])
 * const result = applyPartial(partialUser, mask) // { name: 'John' }
 * ```
 */
export const applyPartial = <
  data extends Partial<GetDataType<mask>>,
  mask extends Mask,
>(data: data, mask: mask): Apply<data, mask> => {
  return applyInternal(data, mask) as Apply<data, mask>
}

/**
 * Apply mask to data with exact type matching.
 *
 * Data must exactly match the mask's expected type - no missing or excess properties.
 * Provides the strictest type checking.
 *
 * @param data - The data to mask (must exactly match expected type)
 * @param mask - The mask to apply
 * @returns The masked data
 *
 * @example
 * ```ts
 * type User = { name: string; email: string }
 * const mask = Mask.pick<User>(['name'])
 *
 * // This works - exact match
 * const user: User = { name: 'John', email: 'john@example.com' }
 * const result = applyExact(user, mask)
 *
 * // This fails - has extra property
 * const userWithExtra = { name: 'John', email: 'john@example.com', age: 30 }
 * const result2 = applyExact(userWithExtra, mask) // Type error!
 * ```
 */
export const applyExact = <
  data,
  mask extends Mask,
>(
  data: ExtendsExact<data, GetDataType<mask>>,
  mask: mask,
): Apply<data, mask> => {
  return applyInternal(data, mask) as Apply<data, mask>
}

// Internal implementation
const applyInternal = (data: any, mask: Mask): any => {
  // ━ Handle binary mask
  if (mask.type === `binary`) {
    return mask.show ? data : undefined
  }

  // ━ Handle properties mask
  if (mask.type === `properties`) {
    // Properties mask requires object data
    if (!Obj.is(data)) {
      throw new Error(`Cannot apply properties mask to non-object data`)
    }

    return objPolicyFilter(mask.mode, data, mask.properties)
  }

  never()
}
