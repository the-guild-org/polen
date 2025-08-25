import { S } from '#lib/kit-temp/effect'
import { describe, expect, test } from '@effect/vitest'

describe('construction vs validation issue', () => {
  test('Effect Schema fails when validating already-constructed objects', () => {
    // Simple schema that transforms string to object
    const TestSchema = S.transform(
      S.String,
      S.Struct({ value: S.String }),
      {
        strict: true,
        decode: (str) => ({ value: str }),
        encode: (obj) => obj.value,
      },
    )

    // 1. Construction works fine - creates decoded object
    const constructed = S.decodeSync(TestSchema)('hello')
    expect(constructed).toEqual({ value: 'hello' })

    // 2. THIS IS THE BUG: Trying to validate the already-constructed object fails
    // because Effect Schema expects encoded form (string) but gets decoded form (object)
    expect(() => {
      S.decodeSync(TestSchema)(constructed as any) // This should work but fails
    }).toThrow('Expected string, actual {"value":"hello"}')
  })

  test('this is exactly what happens in Lifecycles', () => {
    // This reproduces the exact Lifecycles issue
    const VersionSchema = S.transform(
      S.String,
      S.TaggedStruct('Version', { value: S.String }),
      {
        strict: true,
        decode: (str) => ({ _tag: 'Version' as const, value: str }),
        encode: (obj) => obj.value,
      },
    )

    const ContainerSchema = S.TaggedStruct('Container', {
      version: VersionSchema,
    })

    // 1. Create a version object (this works)
    const version = S.decodeSync(VersionSchema)('1.0.0')

    // 2. Create container with the constructed version (this fails!)
    const containerData = {
      _tag: 'Container' as const,
      version: version, // Already-constructed object, not encoded string
    }

    // This fails because Effect Schema expects encoded form but gets decoded form
    expect(() => {
      S.decodeSync(ContainerSchema)(containerData as any)
    }).toThrow('Expected string, actual {"_tag":"Version","value":"1.0.0"}')
  })
})
