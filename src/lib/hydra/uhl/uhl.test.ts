import { describe, expect, test } from 'vitest'
import { UHL } from './$.js'

describe('UHL', () => {
  // dprint-ignore
  describe('toString', () => {
    test.for([
      // Basic segments
      { segments: [{ tag: 'Foo', uniqueKeys: {} }],                                                       expected: 'Foo' },
      { segments: [{ tag: 'User', uniqueKeys: { id: 'abc123' } }],                                        expected: 'User!id@abc123' },
      { segments: [{ tag: 'Widget', uniqueKeys: { count: 42 } }],                                         expected: 'Widget!count@42' },
      { segments: [{ tag: 'Test', uniqueKeys: { b: '2', a: '1' } }],                                      expected: 'Test!a@1!b@2' }, // Keys sorted

      // ADT segments
      { segments: [{ tag: 'TypeVersioned', adt: 'Type', uniqueKeys: { version: '1.0.0' } }],              expected: 'Type@TypeVersioned!version@1.0.0' },
      { segments: [{ tag: 'RevisionInitial', adt: 'Revision', uniqueKeys: { date: '2024-01-15' } }],      expected: 'Revision@RevisionInitial!date@2024-01-15' },

      // Multiple segments
      { segments: [
          { tag: 'SchemaVersioned', adt: 'Schema', uniqueKeys: { version: '1.0.0' } },
          { tag: 'RevisionInitial', adt: 'Revision', uniqueKeys: { date: '2024-01-15' } }
        ],                                                                                                 expected: 'Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15' },

      // Complex cases
      { segments: [
          { tag: 'Schema', adt: 'Type', uniqueKeys: { id: 'x' } },
          { tag: 'Rev', uniqueKeys: { date: '2024' } }
        ],                                                                                                 expected: 'Type@Schema!id@x___Rev!date@2024' },
    ])('$expected', ({ segments, expected }) => {
      const uhl = UHL.make(...segments.map(s => UHL.makeSegment(s.tag, s.uniqueKeys, 'adt' in s ? s.adt : undefined)))
      expect(UHL.toString(uhl)).toBe(expected)
    })
  })

  // dprint-ignore
  describe('fromString', () => {
    test.for([
      // Basic segments
      { string: 'Foo',                                                                                     expected: [{ tag: 'Foo', uniqueKeys: {} }] },
      { string: 'User!id@abc123',                                                                          expected: [{ tag: 'User', uniqueKeys: { id: 'abc123' } }] },
      { string: 'Widget!count@42',                                                                         expected: [{ tag: 'Widget', uniqueKeys: { count: 42 } }] },
      { string: 'Test!a@1!b@2',                                                                            expected: [{ tag: 'Test', uniqueKeys: { a: 1, b: 2 } }] },

      // ADT segments
      { string: 'Type@TypeVersioned!version@1.0.0',                                                        expected: [{ tag: 'TypeVersioned', adt: 'Type', uniqueKeys: { version: '1.0.0' } }] },
      { string: 'Revision@RevisionInitial!date@2024-01-15',                                                expected: [{ tag: 'RevisionInitial', adt: 'Revision', uniqueKeys: { date: '2024-01-15' } }] },

      // Multiple segments
      { string: 'Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15',        expected: [
          { tag: 'SchemaVersioned', adt: 'Schema', uniqueKeys: { version: '1.0.0' } },
          { tag: 'RevisionInitial', adt: 'Revision', uniqueKeys: { date: '2024-01-15' } }
        ] },

      // Empty string
      { string: '',                                                                                        expected: [] },

      // Numeric values
      { string: 'A!k2@42',                                                                                 expected: [{ tag: 'A', uniqueKeys: { k2: 42 } }] },
      { string: 'Type@Schema!id@x___Rev!date@2024',                                                       expected: [
          { tag: 'Schema', adt: 'Type', uniqueKeys: { id: 'x' } },
          { tag: 'Rev', uniqueKeys: { date: 2024 } }
        ] },
    ])('$string', ({ string, expected }) => {
      const uhl = UHL.fromString(string)
      expect(uhl).toEqual(expected)
    })
  })

  describe('round trip', () => {
    // dprint-ignore
    test.for([
      'Foo',
      'User!id@abc123',
      'Widget!count@42',
      'Test!a@1!b@2',
      'Type@TypeVersioned!version@1.0.0',
      'Schema@SchemaVersioned!version@1.0.0___Revision@RevisionInitial!date@2024-01-15',
    ])('%s', (string) => {
      const uhl = UHL.fromString(string)
      expect(UHL.toString(uhl)).toBe(string)
    })
  })

  describe('toFilePath', () => {
    // dprint-ignore
    test.for([
      { uhl: [{ tag: 'Foo', uniqueKeys: {} }],                                                            expected: 'Foo.json' },
      { uhl: [{ tag: 'User', uniqueKeys: { id: 'abc123' } }],                                             expected: 'User!id@abc123.json' },
      { uhl: [
          { tag: 'Schema', adt: 'Type', uniqueKeys: { id: 'x' } },
          { tag: 'Rev', uniqueKeys: { date: '2024' } }
        ],                                                                                                 expected: 'Type@Schema!id@x___Rev!date@2024.json' },
    ])('$expected', ({ uhl, expected }) => {
      const uhlInstance = UHL.make(...uhl.map(s => UHL.makeSegment(s.tag, s.uniqueKeys, 'adt' in s ? s.adt : undefined)))
      expect(UHL.toFilePath(uhlInstance)).toBe(expected)
    })
  })

  describe('segmentEquivalent', () => {
    test('segments are equivalent regardless of key order', () => {
      const seg1 = UHL.makeSegment('Test', { b: '2', a: '1' })
      const seg2 = UHL.makeSegment('Test', { a: '1', b: '2' })
      expect(UHL.segmentEquivalent(seg1, seg2)).toBe(true)
    })

    test('segments with different tags are not equivalent', () => {
      const seg1 = UHL.makeSegment('Widget')
      const seg2 = UHL.makeSegment('Gadget')
      expect(UHL.segmentEquivalent(seg1, seg2)).toBe(false)
    })

    test('segments with different keys are not equivalent', () => {
      const seg1 = UHL.makeSegment('Test', { a: '1' })
      const seg2 = UHL.makeSegment('Test', { a: '2' })
      expect(UHL.segmentEquivalent(seg1, seg2)).toBe(false)
    })

    test('segments with different ADT are not equivalent', () => {
      const seg1 = UHL.makeSegment('Member', {}, 'Type1')
      const seg2 = UHL.makeSegment('Member', {}, 'Type2')
      expect(UHL.segmentEquivalent(seg1, seg2)).toBe(false)
    })
  })

  describe('equivalent', () => {
    test('UHLs are equivalent if all segments match', () => {
      const uhl1 = UHL.make(
        UHL.makeSegment('Widget', { a: '1' }),
        UHL.makeSegment('Gadget', { b: '2' }),
      )
      const uhl2 = UHL.make(
        UHL.makeSegment('Widget', { a: '1' }),
        UHL.makeSegment('Gadget', { b: '2' }),
      )
      expect(UHL.equivalent(uhl1, uhl2)).toBe(true)
    })

    test('UHLs with different lengths are not equivalent', () => {
      const seg1 = UHL.makeSegment('Widget')
      const seg2 = UHL.makeSegment('Gadget')
      const uhl1 = UHL.make(seg1)
      const uhl2 = UHL.make(seg1, seg2)
      expect(UHL.equivalent(uhl1, uhl2)).toBe(false)
    })

    test('UHLs with different segment order are not equivalent', () => {
      const seg1 = UHL.makeSegment('Widget')
      const seg2 = UHL.makeSegment('Gadget')
      const uhl1 = UHL.make(seg1, seg2)
      const uhl2 = UHL.make(seg2, seg1)
      expect(UHL.equivalent(uhl1, uhl2)).toBe(false)
    })
  })

  describe('error handling', () => {
    test('fromString throws on empty segment', () => {
      expect(() => UHL.fromString('___')).toThrow('Invalid segment: ')
    })

    test('fromString throws on invalid property without value', () => {
      expect(() => UHL.fromString('A!k@')).toThrow('Invalid property: k@')
    })

    test('fromString throws on invalid property without key', () => {
      expect(() => UHL.fromString('A!@v')).toThrow('Invalid property: @v')
    })

    test('fromString throws on property without separator', () => {
      expect(() => UHL.fromString('A!key')).toThrow('Invalid property: key')
    })
  })

  describe('reserved character validation', () => {
    // dprint-ignore
    test.for([
      { input: 'Tag@WithAt',                  char: '@',   context: 'tag' },
      { input: 'Tag!WithBang',                char: '!',   context: 'tag' },
      { input: 'Tag___WithTripleUnderscore',  char: '___', context: 'tag' },
    ])('makeSegment throws on reserved character "$char" in tag "$input"', ({ input, context }) => {
      expect(() => UHL.makeSegment(input)).toThrow(`Reserved characters found in ${context}`)
    })

    // dprint-ignore
    test.for([
      { adt: 'ADT@WithAt',                  char: '@',   context: 'adt' },
      { adt: 'ADT!WithBang',                char: '!',   context: 'adt' },
      { adt: 'ADT___WithTripleUnderscore', char: '___', context: 'adt' },
    ])('makeSegment throws on reserved character "$char" in adt "$adt"', ({ adt, context }) => {
      expect(() => UHL.makeSegment('Tag', {}, adt)).toThrow(`Reserved characters found in ${context}`)
    })

    // dprint-ignore
    test.for([
      { key: 'key@',   char: '@',   context: 'unique key name' },
      { key: 'key!',   char: '!',   context: 'unique key name' },
      { key: 'key___', char: '___', context: 'unique key name' },
    ])('makeSegment throws on reserved character "$char" in unique key name "$key"', ({ key, context }) => {
      expect(() => UHL.makeSegment('Tag', { [key]: 'value' })).toThrow(`Reserved characters found in ${context}`)
    })

    // dprint-ignore
    test.for([
      { value: 'value@',   char: '@',   context: 'unique key value' },
      { value: 'value!',   char: '!',   context: 'unique key value' },
      { value: 'value___', char: '___', context: 'unique key value' },
      { value: 'number@42', char: '@',  context: 'unique key value' }, // String value with reserved char
    ])('makeSegment throws on reserved character "$char" in value "$value"', ({ value, context }) => {
      expect(() => UHL.makeSegment('Tag', { key: value })).toThrow(`Reserved characters found in ${context}`)
    })

    test('make throws when creating UHL with invalid segments', () => {
      expect(() => UHL.make(UHL.makeSegment('Tag@Bad'))).toThrow('Reserved characters found in tag')
    })
  })
})

// ============================================================================
// Type Tests
// ============================================================================

import type { Case } from '#lib/kit-temp/other'
import { Ts } from '@wollybeard/kit'

type _ = [
  // Test that Tag is a branded string
  Case<Ts.AssertExtends<UHL.Tag, string>>,
  Case<Ts.AssertExtends<string, UHL.Tag> extends true ? never : true>,

  // Test SegmentTemplate structure
  Case<Ts.AssertExtends<UHL.SegmentTemplate, { tag: string; adt?: string; uniqueKeys: string[] }>>,
]
