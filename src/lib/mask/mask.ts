//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Mask
//
//

/**
 * A mask that can either hide/show data entirely (BinaryMask) or
 * selectively hide/show object properties (PropertiesMask).
 *
 * @template $Data - The data type being masked
 */
export type Mask<$Data = any> = BinaryMask<$Data> | PropertiesMask<$Data extends object ? $Data : object>

/**
 * Create a mask based on the provided options.
 *
 * @param options - Mask configuration:
 *   - `boolean`: Creates a binary mask (true = show, false = hide)
 *   - `string[]`: Creates a properties mask that allows only the specified keys
 *   - `object`: Creates a properties mask based on true/false values per key
 *
 * @returns A mask that can be applied to data
 *
 * @example
 * ```ts
 * // Binary mask
 * const showAll = create(true)
 * const hideAll = create(false)
 *
 * // Properties mask with array
 * const allowMask = create<User>(['name', 'email'])
 *
 * // Properties mask with object
 * const objectMask = create<User>({
 *   name: true,
 *   email: true,
 *   password: false
 * })
 * ```
 */
export const create = <$Data = unknown>(
  options: InferOptions<$Data>,
): Mask<$Data> => {
  if (typeof options === 'boolean') {
    return createBinary(options) as any
  }

  // Array input -> PropertiesMask with 'allow' mode
  if (Array.isArray(options)) {
    return createProperties('allow', options as any) as any
  }

  // Object input -> PropertiesMask based on true/false values
  const entries = Object.entries(options)

  const allowedKeys = entries
    .filter(([_, include]) => include === true)
    .map(([key]) => key)

  const deniedKeys = entries
    .filter(([_, include]) => include === false)
    .map(([key]) => key)

  // If we have denied keys, use deny mode
  if (deniedKeys.length > 0 && allowedKeys.length === 0) {
    return createProperties('deny', deniedKeys) as any
  }

  // Default to allow mode with allowed keys
  return createProperties('allow', allowedKeys) as any
}

/**
 * Valid options for creating a mask for the given data type.
 *
 * @template $Data - The data type to be masked
 */
export type InferOptions<$Data> = unknown extends $Data ? boolean | string[] | Record<string, boolean>
  : $Data extends object ? (
      | boolean
      | (keyof $Data)[]
      | Partial<
        {
          [K in keyof $Data]: boolean
        }
      >
    )
  : boolean

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • PropertiesMask
//
//

/**
 * A mask that selectively shows or hides object properties.
 *
 * @template $Data - The object type being masked
 */
export interface PropertiesMask<$Data extends object = object> {
  type: 'properties'
  /** Whether to allow only specified properties or deny them */
  mode: 'allow' | 'deny'
  /** The list of property keys to allow or deny */
  properties: (keyof $Data)[]
}

/**
 * Create a properties mask.
 *
 * @param mode - 'allow' to show only specified properties, 'deny' to hide them
 * @param properties - Array of property keys to allow or deny
 * @returns A PropertiesMask
 */
export const createProperties = <$Data extends object = object>(
  mode: 'allow' | 'deny',
  properties: (keyof $Data)[],
): PropertiesMask<$Data> => ({
  type: 'properties',
  mode,
  properties,
})

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • BinaryMask
//
//

/**
 * A mask that either shows or hides data entirely.
 *
 * @template _$Data - The data type being masked (used for type inference)
 */
export type BinaryMask<_$Data = any> = {
  type: 'binary'
  /** Whether to show (true) or hide (false) the data */
  show: boolean
}

/**
 * Create a binary mask.
 *
 * @param show - Whether to show (true) or hide (false) the data
 * @returns A BinaryMask
 */
export const createBinary = <$Data = any>(show: boolean): BinaryMask<$Data> => ({
  type: 'binary',
  show,
})

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Convenience Constructors with Semantic Names
//
//

/**
 * Create a mask that shows all data.
 * @returns A BinaryMask with show=true
 */
export const show = (): BinaryMask => ({
  type: 'binary',
  show: true,
})

/**
 * Create a mask that hides all data.
 * @returns A BinaryMask with show=false
 */
export const hide = (): BinaryMask => ({
  type: 'binary',
  show: false,
})

/**
 * Create a mask that shows only the specified properties.
 *
 * @param properties - Array of property keys to show
 * @returns A PropertiesMask in 'allow' mode
 *
 * @example
 * ```ts
 * const userMask = pick<User>(['name', 'email'])
 * // Only 'name' and 'email' will be shown
 * ```
 */
export const pick = <$Data extends object = object>(
  properties: (keyof $Data)[],
): PropertiesMask<$Data> => ({
  type: 'properties',
  mode: 'allow',
  properties,
})

/**
 * Create a mask that hides the specified properties.
 *
 * @param properties - Array of property keys to hide
 * @returns A PropertiesMask in 'deny' mode
 *
 * @example
 * ```ts
 * const userMask = omit<User>(['password', 'ssn'])
 * // Everything except 'password' and 'ssn' will be shown
 * ```
 */
export const omit = <$Data extends object = object>(
  properties: (keyof $Data)[],
): PropertiesMask<$Data> => ({
  type: 'properties',
  mode: 'deny',
  properties,
})

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Utilities
//
//

/**
 * Extract the data type from a mask.
 *
 * @template $Mask - The mask type
 * @returns The data type the mask is designed for
 */
// dprint-ignore
export type GetDataType<$Mask extends Mask<any>> =
  $Mask extends BinaryMask<infer $Data>     ? $Data :
  $Mask extends PropertiesMask<infer $Data> ? $Data
                                            : never
