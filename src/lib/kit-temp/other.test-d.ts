import { Ts } from '@wollybeard/kit'
import { objFilter, ObjOmit, ObjPick, objPolicyFilter } from './other.js'
import type { ObjPolicyFilter } from './other.js'

// Test object for all tests
interface TestObj {
  a: string
  b: number
  c: boolean
  d: string[]
}
declare const testObj: TestObj

// Test 1: objPolicyFilter with allow mode
{
  const result = objPolicyFilter(`allow`, testObj, [`a`, `c`] as const)
  Ts.assertEqual<{ a: string; c: boolean }>()(result)
}

// Test 2: objPolicyFilter with deny mode
{
  const result = objPolicyFilter(`deny`, testObj, [`a`, `c`] as const)
  Ts.assertEqual<{ b: number; d: string[] }>()(result)
}

// Test 3: objFilter returns Partial<T>
{
  const result = objFilter(testObj, (key, value) => value !== `hello`)
  Ts.assertEqual<Partial<TestObj>>()(result)

  // All properties are optional
  Ts.assertSub<typeof result.a>()(undefined)
  Ts.assertSub<typeof result.b>()(undefined)
  Ts.assertSub<typeof result.c>()(undefined)
  Ts.assertSub<typeof result.d>()(undefined)
}

// Test 4: ObjPick type inference
{
  const result = ObjPick(testObj, [`a`, `c`] as const)
  Ts.assertEqual<{ a: string; c: boolean }>()(result)
}

// Test 5: ObjOmit type inference
{
  const result = ObjOmit(testObj, [`a`, `c`] as const)
  Ts.assertEqual<{ b: number; d: string[] }>()(result)
}

// Test 6: ObjPolicyFilter type-level function
{
  type Allow = ObjPolicyFilter<TestObj, `a` | `c`, `allow`>
  type _TestAllow = Ts.AssertExact<Allow, { a: string; c: boolean }>

  type Deny = ObjPolicyFilter<TestObj, `a` | `c`, `deny`>
  type _TestDeny = Ts.AssertExact<Deny, { b: number; d: string[] }>

  type AllowEmpty = ObjPolicyFilter<TestObj, never, `allow`>
  type _TestAllowEmpty = Ts.AssertExact<AllowEmpty, {}>

  type DenyEmpty = ObjPolicyFilter<TestObj, never, `deny`>
  type _TestDenyEmpty = Ts.AssertExact<DenyEmpty, TestObj>
}

// Test 7: Edge cases
{
  // Empty object
  const empty = {}
  const allowEmpty = objPolicyFilter(`allow`, empty, [])
  const denyEmpty = objPolicyFilter(`deny`, empty, [])
  const filterEmpty = objFilter(empty, () => true)

  Ts.assertEqual<{}>()(allowEmpty)
  Ts.assertEqual<{}>()(denyEmpty)
  Ts.assertEqual<{}>()(filterEmpty)

  // Single property object
  const single = { a: 1 }
  const allowSingle = objPolicyFilter(`allow`, single, [`a`] as const)
  const denySingle = objPolicyFilter(`deny`, single, [`a`] as const)
  const filterSingle = objFilter(single, () => true)

  Ts.assertEqual<{ a: number }>()(allowSingle)
  Ts.assertEqual<{}>()(denySingle)
  Ts.assertEqual<{ a?: number }>()(filterSingle)
}

// Test 8: Complex nested object
{
  interface ComplexObj {
    nested: { a: string; b: number }
    array: string[]
    optional?: boolean
    readonly ro: string
  }
  const complexObj = {} as ComplexObj

  const picked = objPolicyFilter(`allow`, complexObj, [`nested`, `optional`] as const)
  Ts.assertEqual<{ nested: { a: string; b: number }; optional?: boolean }>()(picked)

  const omitted = objPolicyFilter(`deny`, complexObj, [`nested`, `optional`] as const)
  Ts.assertEqual<{ array: string[]; readonly ro: string }>()(omitted)

  const filtered = objFilter(complexObj, (key) => key !== `array`)
  Ts.assertEqual<Partial<ComplexObj>>()(filtered)
}

// Test 9: Keys parameter type inference
{
  // With const assertion
  const keys1 = [`a`, `c`] as const
  const result1 = objPolicyFilter(`allow`, testObj, keys1)
  Ts.assertEqual<{ a: string; c: boolean }>()(result1)

  // Without const assertion (wider type)
  const keys2: (keyof TestObj)[] = [`a`, `c`]
  const result2 = objPolicyFilter(`allow`, testObj, keys2)
  // Result is a union of all possible picks
  type Result2 = typeof result2 // Pick<TestObj, keyof TestObj>
}
