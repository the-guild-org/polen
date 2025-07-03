/**
 * SemVer type system for flexible version handling
 */

import { type Brand } from '#lib/kit-temp'
import type { Version as SemVerObject } from '@vltpkg/semver'
import { parse as semverParse } from '@vltpkg/semver'
import { z } from 'zod/v4'

/**
 * Branded type for validated semver strings.
 *
 * This ensures that only strings that have been validated as proper
 * semver format can be used where a SemVerString is expected.
 *
 * @example
 * const version: SemVerString = '1.2.3' as SemVerString // unsafe cast
 * const validated: SemVerString = SemVerSchema.parse('1.2.3') // safe validation
 */
export type SemVerString = Brand<string, 'SemVer'>

/**
 * Zod schema for validating and transforming semver strings.
 *
 * Validates that a string is in proper semver format and transforms
 * it to the branded SemVerString type.
 *
 * @example
 * const version = SemVerSchema.parse('1.2.3') // SemVerString
 * const invalid = SemVerSchema.parse('not-semver') // throws ZodError
 */
export const SemVerStringSchema = z.string()
  .refine(
    (val) => semverParse(val) !== undefined,
    { message: 'Must be valid semver format' },
  )
  .transform((val) => val as SemVerString)

/**
 * Union type that accepts either a branded semver string or a parsed semver object.
 *
 * This flexible input type allows functions to accept either form of semver,
 * avoiding repeated parsing when the parsed object is already available.
 *
 * @example
 * function isPrerelease(semVerInput: SemVerInput): boolean {
 *   const parsed = normalizeSemVerInput(semVerInput)
 *   return parsed.prerelease !== undefined && parsed.prerelease.length > 0
 * }
 *
 * // Can pass a Version object's semver directly (already parsed)
 * const version: Version = await getVersion()
 * if (isPrerelease(version.semver)) { ... }
 *
 * // Or pass a string
 * if (isPrerelease('1.2.3-beta.1' as SemVerString)) { ... }
 */
export type SemVerInput = SemVerString | SemVerObject

/**
 * Normalizes a SemVerInput to its parsed object form.
 *
 * This helper allows functions to work with the parsed representation
 * regardless of whether they receive a string or object input.
 *
 * @param semVerInput - Either a SemVerString or SemVerObject
 * @returns The parsed SemVerObject
 * @throws Error if the string cannot be parsed as valid semver
 *
 * @example
 * const obj1 = normalizeSemVerInput('1.2.3' as SemVerString)
 * const obj2 = normalizeSemVerInput(alreadyParsedObject)
 * // obj1 and obj2 are both SemVerObject instances
 */
export const normalizeSemVerInput = (semVerInput: SemVerInput): SemVerObject => {
  if (typeof semVerInput === 'string') {
    const parsed = semverParse(semVerInput)
    if (!parsed) {
      throw new Error(`Invalid semver: ${semVerInput}`)
    }
    return parsed
  }
  return semVerInput
}

/**
 * Gets the string representation of a SemVerInput.
 *
 * This helper provides a consistent way to get the string form
 * regardless of whether you have a string or object input.
 *
 * @param semVerInput - Either a SemVerString or SemVerObject
 * @returns The string representation of the semver
 *
 * @example
 * const str1 = getSemVerString('1.2.3' as SemVerString) // '1.2.3'
 * const str2 = getSemVerString(parsedObject) // e.g., '1.2.3-beta.1'
 */
export const getSemVerString = (semVerInput: SemVerInput): string => {
  if (typeof semVerInput === 'string') {
    return semVerInput
  }
  return String(semVerInput)
}

/**
 * Type guard to check if a value is a valid SemVerString.
 *
 * Uses the SemVerSchema to validate that the value is a string
 * in proper semver format.
 *
 * @param value - The value to check
 * @returns True if the value is a valid SemVerString
 *
 * @example
 * const input: unknown = '1.2.3'
 * if (isSemVerString(input)) {
 *   // input is now typed as SemVerString
 *   const parsed = normalizeSemVerInput(input)
 * }
 */
export const isSemVerString = (value: unknown): value is SemVerString => {
  return SemVerStringSchema.safeParse(value).success
}
