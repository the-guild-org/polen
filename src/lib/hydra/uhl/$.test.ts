import { describe, expect, test } from 'vitest'
import { Test } from '../../../../tests/unit/helpers/test.js'
import { Uhl } from './$.js'

interface ToStringCase {
  segments: Parameters<typeof Uhl.Segment.make>[0][]
  expected: string
}

// dprint-ignore
Test.suite<ToStringCase>('toString', [
    // Basic segments
    { name: 'Foo',                                                                                       segments: [{ tag: 'Foo', uniqueKeys: {} }],                                                       expected: 'Foo' },
    { name: 'User!id@abc123',                                                                            segments: [{ tag: 'User', uniqueKeys: { id: 'abc123' } }],                                        expected: 'User!id@abc123' },
    { name: 'Widget!count@42',                                                                           segments: [{ tag: 'Widget', uniqueKeys: { count: 42 } }],                                         expected: 'Widget!count@42' },
    { name: 'Test!a@1!b@2 (keys sorted)',                                                                segments: [{ tag: 'Test', uniqueKeys: { b: '2', a: '1' } }],                                      expected: 'Test!a@1!b@2' },

    // ADT segments
    { name: 'Type@TypeVersioned!version@1.0.0',                                                          segments: [{ tag: 'TypeVersioned', adt: 'Type', uniqueKeys: { version: '1.0.0' } }],              expected: 'Type@TypeVersioned!version@1.0.0' },
    { name: 'Revision@RevisionInitial!date@2024-01-15',                                                  segments: [{ tag: 'RevisionInitial', adt: 'Revision', uniqueKeys: { date: '2024-01-15' } }],      expected: 'Revision@RevisionInitial!date@2024-01-15' },

    // Multiple segments
    { name: 'Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15',           segments: [
        { tag: 'SchemaVersioned', adt: 'Schema', uniqueKeys: { version: '1.0.0' } },
        { tag: 'RevisionInitial', adt: 'Revision', uniqueKeys: { date: '2024-01-15' } }
      ],                                                                                                 expected: 'Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15' },

    // Complex cases
    { name: 'Type@Schema!id@x___Rev!date@2024',                                                         segments: [
        { tag: 'Schema', adt: 'Type', uniqueKeys: { id: 'x' } },
        { tag: 'Rev', uniqueKeys: { date: '2024' } }
      ],                                                                                                 expected: 'Type@Schema!id@x___Rev!date@2024' },
  ], ({ segments, expected }) => {
  const uhl = Uhl.make(...segments.map(s => Uhl.Segment.make(s)))
  expect(Uhl.toString(uhl)).toBe(expected)
})

interface FromStringCase {
  string: string
  expected: Parameters<typeof Uhl.Segment.make>[0][]
}

// dprint-ignore
Test.suite<FromStringCase>('fromString', [
    // Basic segments
    { name: 'Foo',                                                                                       string: 'Foo',                                                                                     expected: [{ tag: 'Foo', uniqueKeys: {} }] },
    { name: 'User!id@abc123',                                                                            string: 'User!id@abc123',                                                                          expected: [{ tag: 'User', uniqueKeys: { id: 'abc123' } }] },
    { name: 'Widget!count@42',                                                                           string: 'Widget!count@42',                                                                         expected: [{ tag: 'Widget', uniqueKeys: { count: 42 } }] },
    { name: 'Test!a@1!b@2',                                                                              string: 'Test!a@1!b@2',                                                                            expected: [{ tag: 'Test', uniqueKeys: { a: 1, b: 2 } }] },

    // ADT segments
    { name: 'Type@TypeVersioned!version@1.0.0',                                                          string: 'Type@TypeVersioned!version@1.0.0',                                                        expected: [{ tag: 'TypeVersioned', adt: 'Type', uniqueKeys: { version: '1.0.0' } }] },
    { name: 'Revision@RevisionInitial!date@2024-01-15',                                                  string: 'Revision@RevisionInitial!date@2024-01-15',                                                expected: [{ tag: 'RevisionInitial', adt: 'Revision', uniqueKeys: { date: '2024-01-15' } }] },

    // Multiple segments
    { name: 'Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15',          string: 'Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15',        expected: [
        { tag: 'SchemaVersioned', adt: 'Schema', uniqueKeys: { version: '1.0.0' } },
        { tag: 'RevisionInitial', adt: 'Revision', uniqueKeys: { date: '2024-01-15' } }
      ] },

    // Empty string
    { name: 'empty string',                                                                              string: '',                                                                                        expected: [] },

    // Numeric values
    { name: 'A!k2@42',                                                                                   string: 'A!k2@42',                                                                                 expected: [{ tag: 'A', uniqueKeys: { k2: 42 } }] },
    { name: 'Type@Schema!id@x___Rev!date@2024',                                                         string: 'Type@Schema!id@x___Rev!date@2024',                                                       expected: [
        { tag: 'Schema', adt: 'Type', uniqueKeys: { id: 'x' } },
        { tag: 'Rev', uniqueKeys: { date: 2024 } }
      ] },
  ], ({ string, expected }) => {
  const uhl = Uhl.fromString(string)
  
  if (expected.length === 0) {
    expect(uhl._tag).toBe('UhlRoot')
  } else {
    expect(uhl._tag).toBe('UhlPath')
    if (uhl._tag === 'UhlPath') {
      expect(uhl.segments).toHaveLength(expected.length)
      for (let i = 0; i < expected.length; i++) {
        expect(uhl.segments[i]).toMatchObject(expected[i]!)
      }
    }
  }
})

// dprint-ignore
Test.suite<{ string: string }>('round trip', [
  { name: 'Foo',                                                                                       string: 'Foo' },
  { name: 'User!id@abc123',                                                                            string: 'User!id@abc123' },
  { name: 'Widget!count@42',                                                                           string: 'Widget!count@42' },
  { name: 'Test!a@1!b@2',                                                                              string: 'Test!a@1!b@2' },
  { name: 'Type@TypeVersioned!version@1.0.0',                                                          string: 'Type@TypeVersioned!version@1.0.0' },
  { name: 'Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15',          string: 'Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15' },
], ({ string }) => {
  const uhl = Uhl.fromString(string)
  expect(Uhl.toString(uhl)).toBe(string)
})

interface ToFilePathCase {
  uhl: Parameters<typeof Uhl.Segment.make>[0][]
  expected: string
}

// dprint-ignore
Test.suite<ToFilePathCase>('toFilePath', [
  { name: 'Foo.json',                                                                                  uhl: [{ tag: 'Foo', uniqueKeys: {} }],                                                            expected: 'Foo.json' },
  { name: 'User!id@abc123.json',                                                                       uhl: [{ tag: 'User', uniqueKeys: { id: 'abc123' } }],                                             expected: 'User!id@abc123.json' },
  { name: 'Type@Schema!id@x___Rev!date@2024.json',                                                     uhl: [
      { tag: 'Schema', adt: 'Type', uniqueKeys: { id: 'x' } },
      { tag: 'Rev', uniqueKeys: { date: '2024' } }
    ],                                                                                                 expected: 'Type@Schema!id@x___Rev!date@2024.json' },
], ({ uhl, expected }) => {
  const uhlInstance = Uhl.make(...uhl.map(s => Uhl.Segment.make(s)))
  expect(Uhl.toFileName(uhlInstance)).toBe(expected)
})

describe('toFileName', () => {
  test('toFileName is an alias for toFilePath', () => {
    const uhl = Uhl.make(Uhl.Segment.make({ tag: 'SchemaVersioned', uniqueKeys: { version: '1.0.0' }, adt: 'Schema' }))
    expect(Uhl.toFileName(uhl)).toBe(Uhl.toFileName(uhl))
    expect(Uhl.toFileName(uhl)).toBe('Schema@SchemaVersioned!version@1.0.0.json')
  })
})

interface FromFileNameCase {
  fileName: string
  expected: Uhl.Uhl
}

// dprint-ignore
Test.suite<FromFileNameCase>('fromFileName', [
  { name: 'Schema@SchemaVersioned!version@1.0.0.json',                                                 fileName: 'Schema@SchemaVersioned!version@1.0.0.json',
    expected: Uhl.make(Uhl.Segment.make({ tag: 'SchemaVersioned', uniqueKeys: { version: '1.0.0' }, adt: 'Schema' }))
  },
  { name: 'User!id@abc123.json',                                                                       fileName: 'User!id@abc123.json',
    expected: Uhl.make(Uhl.Segment.make({ tag: 'User', uniqueKeys: { id: 'abc123' } }))
  },
], ({ fileName, expected }) => {
  const parsed = Uhl.fromFileName(fileName)
  expect(Uhl.equivalent(parsed, expected)).toBe(true)
})

test('fromFileName handles files without .json extension', () => {
  const parsed = Uhl.fromFileName('User!id@123')
  const expected = Uhl.make(Uhl.Segment.make({ tag: 'User', uniqueKeys: { id: 123 } }))
  expect(Uhl.equivalent(parsed, expected)).toBe(true)
})

describe('Segment.equivalent', () => {
  test('segments are equivalent regardless of key order', () => {
    const seg1 = Uhl.Segment.make({ tag: 'Test', uniqueKeys: { b: '2', a: '1' } })
    const seg2 = Uhl.Segment.make({ tag: 'Test', uniqueKeys: { a: '1', b: '2' } })
    expect(Uhl.Segment.equivalent(seg1, seg2)).toBe(true)
  })

  test('segments with different tags are not equivalent', () => {
    const seg1 = Uhl.Segment.make({ tag: 'Widget' })
    const seg2 = Uhl.Segment.make({ tag: 'Gadget' })
    expect(Uhl.Segment.equivalent(seg1, seg2)).toBe(false)
  })

  test('segments with different keys are not equivalent', () => {
    const seg1 = Uhl.Segment.make({ tag: 'Test', uniqueKeys: { a: '1' } })
    const seg2 = Uhl.Segment.make({ tag: 'Test', uniqueKeys: { a: '2' } })
    expect(Uhl.Segment.equivalent(seg1, seg2)).toBe(false)
  })

  test('segments with different ADT are not equivalent', () => {
    const seg1 = Uhl.Segment.make({ tag: 'Member', adt: 'Type1' })
    const seg2 = Uhl.Segment.make({ tag: 'Member', adt: 'Type2' })
    expect(Uhl.Segment.equivalent(seg1, seg2)).toBe(false)
  })
})

describe('equivalent', () => {
  test('UHLs are equivalent if all segments match', () => {
    const uhl1 = Uhl.make(
      Uhl.Segment.make({ tag: 'Widget', uniqueKeys: { a: '1' } }),
      Uhl.Segment.make({ tag: 'Gadget', uniqueKeys: { b: '2' } }),
    )
    const uhl2 = Uhl.make(
      Uhl.Segment.make({ tag: 'Widget', uniqueKeys: { a: '1' } }),
      Uhl.Segment.make({ tag: 'Gadget', uniqueKeys: { b: '2' } }),
    )
    expect(Uhl.equivalent(uhl1, uhl2)).toBe(true)
  })

  test('UHLs with different lengths are not equivalent', () => {
    const seg1 = Uhl.Segment.make({ tag: 'Widget' })
    const seg2 = Uhl.Segment.make({ tag: 'Gadget' })
    const uhl1 = Uhl.make(seg1)
    const uhl2 = Uhl.make(seg1, seg2)
    expect(Uhl.equivalent(uhl1, uhl2)).toBe(false)
  })

  test('UHLs with different segment order are not equivalent', () => {
    const seg1 = Uhl.Segment.make({ tag: 'Widget' })
    const seg2 = Uhl.Segment.make({ tag: 'Gadget' })
    const uhl1 = Uhl.make(seg1, seg2)
    const uhl2 = Uhl.make(seg2, seg1)
    expect(Uhl.equivalent(uhl1, uhl2)).toBe(false)
  })
})

Test.suite<{ input: string; error: string }>('error handling', [
  { name: 'fromString throws on empty segment', input: '___', error: 'Invalid segment: ' },
  { name: 'fromString throws on invalid property without value', input: 'A!k@', error: 'Invalid property: k@' },
  { name: 'fromString throws on invalid property without key', input: 'A!@v', error: 'Invalid property: @v' },
  { name: 'fromString throws on property without separator', input: 'A!key', error: 'Invalid property: key' },
], ({ input, error }) => {
  expect(() => Uhl.fromString(input)).toThrow(error)
})

describe('codec handling', () => {
  describe('when uniqueKeys contain non-primitive values', () => {
    test('should fail when passing object instead of string/number', () => {
      const objectValue = { some: 'object' }

      // This should fail because uniqueKeys must be strings or numbers
      expect(() =>
        Uhl.Segment.make({
          tag: 'SchemaVersioned',
          adt: 'Schema',
          uniqueKeys: { version: objectValue as any },
        })
      ).toThrow()
    })

    test('should fail when passing Date object', () => {
      const date = new Date('2024-01-15')

      // This should fail because date is a Date object, not a string
      expect(() =>
        Uhl.Segment.make({
          tag: 'RevisionInitial',
          adt: 'Revision',
          uniqueKeys: { date: date as any },
        })
      ).toThrow()
    })

    test('should fail when passing array', () => {
      const arrayValue = ['a', 'b', 'c']

      expect(() =>
        Uhl.Segment.make({
          tag: 'Test',
          uniqueKeys: { items: arrayValue as any },
        })
      ).toThrow()
    })

    test('should fail when passing function', () => {
      const funcValue = () => 'hello'

      expect(() =>
        Uhl.Segment.make({
          tag: 'Test',
          uniqueKeys: { func: funcValue as any },
        })
      ).toThrow()
    })

    test('should work with properly encoded string values', () => {
      const segment = Uhl.Segment.make({
        tag: 'SchemaVersioned',
        adt: 'Schema',
        uniqueKeys: { version: '3.0.0' },
      })

      expect(segment.uniqueKeys['version']).toBe('3.0.0')
      expect(typeof segment.uniqueKeys['version']).toBe('string')
    })

    test('should work with number values', () => {
      const segment = Uhl.Segment.make({
        tag: 'Widget',
        uniqueKeys: { count: 42 },
      })

      expect(segment.uniqueKeys['count']).toBe(42)
      expect(typeof segment.uniqueKeys['count']).toBe('number')
    })
  })

  describe('UHL string serialization with encoded values', () => {
    test('should correctly serialize string values', () => {
      const segment = Uhl.Segment.make({
        tag: 'SchemaVersioned',
        adt: 'Schema',
        uniqueKeys: { version: '1.2.3' },
      })

      const uhl = Uhl.make(segment)
      expect(Uhl.toString(uhl)).toBe('Schema@SchemaVersioned!version@1.2.3')
    })

    test('should correctly serialize date strings', () => {
      const dateString = '2024-01-15T00:00:00.000Z'

      const segment = Uhl.Segment.make({
        tag: 'RevisionInitial',
        adt: 'Revision',
        uniqueKeys: { date: dateString },
      })

      const uhl = Uhl.make(segment)
      expect(Uhl.toString(uhl)).toBe('Revision@RevisionInitial!date@2024-01-15T00:00:00.000Z')
    })

    test('should correctly serialize multiple encoded values', () => {
      const segment = Uhl.Segment.make({
        tag: 'ComplexType',
        uniqueKeys: {
          version: '2.0.0',
          date: '2024-12-25',
          count: 100,
        },
      })

      const uhl = Uhl.make(segment)
      // Keys should be sorted alphabetically
      expect(Uhl.toString(uhl)).toBe('ComplexType!count@100!date@2024-12-25!version@2.0.0')
    })
  })
})
