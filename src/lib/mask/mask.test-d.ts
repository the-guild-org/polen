import { Ts } from '@wollybeard/kit'
import { Mask } from './$.js'
import type { InferOptions, Mask as MaskType, PropertiesMask } from './mask.js'

// Test 1: InferOptions with unknown should accept all option types
{
  type Options = InferOptions<unknown>

  // This is a type-level assertion - we need to use a different pattern
  type _Test = Ts.AssertEqual<Options, boolean | string[] | Record<string, boolean>>

  // All of these should be valid options
  const option1: Options = true
  const option2: Options = false
  const option3: Options = [`name`, `age`]
  const option4: Options = []
  const option5: Options = { name: true, age: false }
  const option6: Options = {}
}

// Test 2: Mask.create with unknown data type should accept all option types
{
  // Boolean options
  const mask1 = Mask.create(true)
  const mask2 = Mask.create(false)
  // Without explicit type parameter, returns union type
  Ts.assertEqual<MaskType<unknown>>()(mask1)
  Ts.assertEqual<MaskType<unknown>>()(mask2)

  // Array options (no type parameter needed)
  const mask3 = Mask.create([`name`, `age`])
  const mask4 = Mask.create([])
  const mask5 = Mask.create([`a`, `b`, `c`])
  // Returns union type with inferred properties
  Ts.assertEqual<MaskType<{ name: any; age: any }>>()(mask3)
  Ts.assertEqual<MaskType<unknown>>()(mask4)
  Ts.assertEqual<MaskType<{ a: any; b: any; c: any }>>()(mask5)

  // Object options
  const mask6 = Mask.create({ name: true, age: false })
  const mask7 = Mask.create({})
  const mask8 = Mask.create({ foo: true, bar: true, baz: false })
  // Returns union type with inferred properties
  Ts.assertEqual<MaskType<unknown>>()(mask6)
  Ts.assertEqual<MaskType<unknown>>()(mask7)
  Ts.assertEqual<MaskType<unknown>>()(mask8)
}

// Test 3: With specific data type, options are constrained
{
  interface User {
    name: string
    age: number
    email: string
  }

  // Valid options
  const mask1 = Mask.create<User>(true)
  const mask2 = Mask.create<User>([`name`, `age`])
  const mask3 = Mask.create<User>({ name: true, age: false, email: true })

  // With explicit type parameter, still returns union type
  Ts.assertEqual<MaskType<User>>()(mask1)
  Ts.assertEqual<MaskType<User>>()(mask2)
  Ts.assertEqual<MaskType<User>>()(mask3)

  // Invalid cases would be compile errors
  // const mask4 = Mask.create<User>(['invalid']) // Error: 'invalid' is not a key of User
  // const mask5 = Mask.create<User>({ invalid: true }) // Error: 'invalid' is not a property of User
}

// Test 4: Non-object types only accept boolean
{
  const mask1 = Mask.create<string>(true)
  const mask2 = Mask.create<string>(false)

  Ts.assertEqual<MaskType<string>>()(mask1)
  Ts.assertEqual<MaskType<string>>()(mask2)

  // Invalid cases would be compile errors
  // const mask3 = Mask.create<string>(['prop']) // Error: string is not an object
  // const mask4 = Mask.create<string>({ prop: true }) // Error: string is not an object
}

// Test 5: Test inference in practical scenarios
{
  // Should infer PropertiesMask with object data type
  const userMask = Mask.create([`name`, `email`, `password`])
  Ts.assertEqual<MaskType<{ name: any; email: any; password: any }>>()(userMask)

  // When mask is a union type, apply returns a union of possible results
  const user1 = { name: `John`, email: `john@example.com`, password: `secret`, extra: `data` }
  const maskedUser1 = Mask.apply(user1, userMask)
  // Result is a union type that includes the properties mask result
  type MaskedUser1 = typeof maskedUser1
  // Can't use assertSub with union types

  // For partial data, use applyPartial
  const user2 = { name: `Jane`, email: `jane@example.com` }
  const maskedUser2 = Mask.applyPartial(user2, userMask)
  // Result is a union type
  type MaskedUser2 = typeof maskedUser2
}

// Test 6: Pick and omit helpers
{
  const pick1 = Mask.pick([`name`, `email`])
  const omit1 = Mask.omit([`password`, `secret`])

  // Infers specific property types
  Ts.assertEqual<PropertiesMask<{ name: any; email: any }>>()(pick1)
  Ts.assertEqual<PropertiesMask<{ password: any; secret: any }>>()(omit1)

  interface User {
    name: string
    email: string
    password: string
  }
  const pick2 = Mask.pick<User>([`name`, `email`])
  const omit2 = Mask.omit<User>([`password`])

  Ts.assertEqual<PropertiesMask<User>>()(pick2)
  Ts.assertEqual<PropertiesMask<User>>()(omit2)
}

// Test 7: Apply type transformations
{
  interface User {
    name: string
    email: string
    password: string
  }
  const user: User = { name: `John`, email: `john@example.com`, password: `secret` }

  // Binary mask
  const showMask = Mask.create<User>(true)
  const hideMask = Mask.create<User>(false)
  const shown = Mask.apply(user, showMask)
  const hidden = Mask.apply(user, hideMask)

  // showMask and hideMask are MaskType<User> (union types), so results are unions
  type ShownType = typeof shown // Omit<User, keyof User> | undefined
  type HiddenType = typeof hidden // Omit<User, keyof User> | undefined

  // Properties mask - allow mode
  const allowMask = Mask.create<User>([`name`, `email`])
  const allowed = Mask.apply(user, allowMask)
  // Result is a union due to mask being a union type
  type AllowedType = typeof allowed

  // Properties mask - deny mode
  const denyMask = Mask.create<User>({ password: false })
  const denied = Mask.apply(user, denyMask)
  // Result is a union due to mask being a union type
  type DeniedType = typeof denied
}
