import { S } from '#lib/kit-temp/effect'
import { EffectKit } from '#lib/kit-temp/effect'
import { describe, expect, test } from 'vitest'

const UnionAdt = EffectKit.Schema.UnionAdt

describe('parseADTs', () => {
  test.for([
    // dprint-ignore
    { tags: ['CatalogVersioned', 'CatalogUnversioned'], expected: new Map([['Catalog', { name: 'Catalog', members: [{ tag: 'CatalogVersioned', memberName: 'Versioned' }, { tag: 'CatalogUnversioned', memberName: 'Unversioned' }] }]]) },
    {
      tags: ['SchemaVersioned', 'SchemaUnversioned'],
      expected: new Map([['Schema', {
        name: 'Schema',
        members: [{ tag: 'SchemaVersioned', memberName: 'Versioned' }, {
          tag: 'SchemaUnversioned',
          memberName: 'Unversioned',
        }],
      }]]),
    },
    {
      tags: ['CatalogVersioned', 'CatalogUnversioned', 'SchemaVersioned', 'SchemaUnversioned'],
      expected: new Map([['Catalog', {
        name: 'Catalog',
        members: [{ tag: 'CatalogVersioned', memberName: 'Versioned' }, {
          tag: 'CatalogUnversioned',
          memberName: 'Unversioned',
        }],
      }], ['Schema', {
        name: 'Schema',
        members: [{ tag: 'SchemaVersioned', memberName: 'Versioned' }, {
          tag: 'SchemaUnversioned',
          memberName: 'Unversioned',
        }],
      }]]),
    },
    { tags: ['User', 'Post'], expected: new Map() },
    { tags: ['CatalogVersioned', 'User'], expected: new Map() }, // Only one Catalog member
    { tags: [], expected: new Map() },
  ])('$tags -> $expected.size ADTs', ({ tags, expected }) => {
    expect(UnionAdt.parseADTs(tags)).toEqual(expected)
  })
})

describe('isADTMember', () => {
  test.for([
    // dprint-ignore
    { tag: 'CatalogVersioned', allTags: ['CatalogVersioned', 'CatalogUnversioned'], expected: true },
    { tag: 'CatalogUnversioned', allTags: ['CatalogVersioned', 'CatalogUnversioned'], expected: true },
    { tag: 'User', allTags: ['CatalogVersioned', 'CatalogUnversioned', 'User'], expected: false },
    { tag: 'CatalogVersioned', allTags: ['CatalogVersioned'], expected: false }, // Only one member
    { tag: 'userProfile', allTags: ['userProfile', 'userSettings'], expected: false }, // Lowercase
  ])('$tag in $allTags -> $expected', ({ tag, allTags, expected }) => {
    expect(UnionAdt.isADTMember(tag, allTags)).toBe(expected)
  })
})

describe('getADTInfo', () => {
  test.for([
    // dprint-ignore
    { tag: 'CatalogVersioned', allTags: ['CatalogVersioned', 'CatalogUnversioned'], expected: { adtName: 'Catalog', memberName: 'Versioned' } },
    {
      tag: 'SchemaUnversioned',
      allTags: ['SchemaVersioned', 'SchemaUnversioned'],
      expected: { adtName: 'Schema', memberName: 'Unversioned' },
    },
    { tag: 'User', allTags: ['User', 'Post'], expected: null },
    { tag: 'CatalogVersioned', allTags: ['CatalogVersioned'], expected: null }, // Only one member
  ])('$tag -> $expected', ({ tag, allTags, expected }) => {
    expect(UnionAdt.getADTInfo(tag, allTags)).toEqual(expected)
  })
})

describe('formatADTTag', () => {
  test.for([
    // dprint-ignore
    { adtName: 'Catalog', memberName: 'Versioned', expected: 'CatalogVersioned' },
    { adtName: 'Schema', memberName: 'Unversioned', expected: 'SchemaUnversioned' },
    { adtName: 'Revision', memberName: 'Initial', expected: 'RevisionInitial' },
  ])('$adtName + $memberName -> $expected', ({ adtName, memberName, expected }) => {
    expect(UnionAdt.formatADTTag(adtName, memberName)).toBe(expected)
  })
})

// Path conversion tests removed - these belong in hydra, not in EffectKit

// Type-level tests

const CatalogVersioned = S.TaggedStruct('CatalogVersioned', {})
const CatalogUnversioned = S.TaggedStruct('CatalogUnversioned', {})
const User = S.TaggedStruct('User', {})

const CatalogUnion = S.Union(CatalogVersioned, CatalogUnversioned)
const MixedUnion = S.Union(CatalogVersioned, CatalogUnversioned, User)
const SingleUnion = S.Union(User)
