import { EffectKit } from '#lib/kit-temp/$$'
import { expect } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'

const UnionAdt = EffectKit.Schema.UnionAdt

interface ParseCase {
  tags: string[]
  expected: ReturnType<typeof UnionAdt.parse>
}

// dprint-ignore
Test.suite<ParseCase>('parse', [
  { name: 'CatalogVersioned, CatalogUnversioned -> Catalog ADT',                                       tags: ['CatalogVersioned', 'CatalogUnversioned'], expected: { name: 'Catalog', members: [{ tag: 'CatalogVersioned', memberName: 'Versioned' }, { tag: 'CatalogUnversioned', memberName: 'Unversioned' }] } },
  { name: 'SchemaVersioned, SchemaUnversioned -> Schema ADT',                                          tags: ['SchemaVersioned', 'SchemaUnversioned'],
    expected: {
      name: 'Schema',
      members: [{ tag: 'SchemaVersioned', memberName: 'Versioned' }, {
        tag: 'SchemaUnversioned',
        memberName: 'Unversioned',
      }],
    },
  },
  { name: 'User, Post -> null (non-ADT)',                                                              tags: ['User', 'Post'], expected: null },
  { name: 'CatalogVersioned, User -> null (mixed ADT)',                                                tags: ['CatalogVersioned', 'User'], expected: null },
  { name: 'CatalogVersioned -> null (only one member)',                                                tags: ['CatalogVersioned'], expected: null },
  { name: 'empty array -> null',                                                                       tags: [], expected: null },
], ({ tags, expected }) => {
  expect(UnionAdt.parse(tags)).toEqual(expected)
})

interface IsADTMemberCase {
  tag: string
  allTags: string[]
  expected: boolean
}

// dprint-ignore
Test.suite<IsADTMemberCase>('isADTMember', [
  { name: 'CatalogVersioned in [CatalogVersioned, CatalogUnversioned] -> true',                        tag: 'CatalogVersioned', allTags: ['CatalogVersioned', 'CatalogUnversioned'], expected: true },
  { name: 'CatalogUnversioned in [CatalogVersioned, CatalogUnversioned] -> true',                      tag: 'CatalogUnversioned', allTags: ['CatalogVersioned', 'CatalogUnversioned'], expected: true },
  { name: 'User in [CatalogVersioned, CatalogUnversioned, User] -> false',                             tag: 'User', allTags: ['CatalogVersioned', 'CatalogUnversioned', 'User'], expected: false },
  { name: 'CatalogVersioned in [CatalogVersioned] -> false (only one member)',                         tag: 'CatalogVersioned', allTags: ['CatalogVersioned'], expected: false },
  { name: 'userProfile in [userProfile, userSettings] -> false (lowercase)',                           tag: 'userProfile', allTags: ['userProfile', 'userSettings'], expected: false },
], ({ tag, allTags, expected }) => {
  expect(UnionAdt.isADTMember(tag, allTags)).toBe(expected)
})

interface GetADTInfoCase {
  tag: string
  allTags: string[]
  expected: ReturnType<typeof UnionAdt.getADTInfo>
}

// dprint-ignore
Test.suite<GetADTInfoCase>('getADTInfo', [
  { name: 'CatalogVersioned -> { adtName: Catalog, memberName: Versioned }',                           tag: 'CatalogVersioned', allTags: ['CatalogVersioned', 'CatalogUnversioned'], expected: { adtName: 'Catalog', memberName: 'Versioned' } },
  { name: 'SchemaUnversioned -> { adtName: Schema, memberName: Unversioned }',                         tag: 'SchemaUnversioned',
    allTags: ['SchemaVersioned', 'SchemaUnversioned'],
    expected: { adtName: 'Schema', memberName: 'Unversioned' },
  },
  { name: 'User -> null (non-ADT)',                                                                    tag: 'User', allTags: ['User', 'Post'], expected: null },
  { name: 'CatalogVersioned -> null (only one member)',                                                tag: 'CatalogVersioned', allTags: ['CatalogVersioned'], expected: null },
], ({ tag, allTags, expected }) => {
  expect(UnionAdt.getADTInfo(tag, allTags)).toEqual(expected)
})

interface FormatADTTagCase {
  adtName: string
  memberName: string
  expected: string
}

// dprint-ignore
Test.suite<FormatADTTagCase>('formatADTTag', [
  { name: 'Catalog + Versioned -> CatalogVersioned',                                                   adtName: 'Catalog', memberName: 'Versioned', expected: 'CatalogVersioned' },
  { name: 'Schema + Unversioned -> SchemaUnversioned',                                                 adtName: 'Schema', memberName: 'Unversioned', expected: 'SchemaUnversioned' },
  { name: 'Revision + Initial -> RevisionInitial',                                                     adtName: 'Revision', memberName: 'Initial', expected: 'RevisionInitial' },
], ({ adtName, memberName, expected }) => {
  expect(UnionAdt.formatADTTag(adtName, memberName)).toBe(expected)
})
