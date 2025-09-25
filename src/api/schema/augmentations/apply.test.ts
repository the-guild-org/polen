import { Test } from '@wollybeard/kit/test'
import { GrafaidOld, GraphQLSchemaPath } from 'graphql-kit'
import { describe, expect, test } from 'vitest'
import { mutateDescription } from './apply.js'
import type { AugmentationConfig } from './config.js'

const on = GraphQLSchemaPath.Nodes.Root.make()

describe('with empty existing description', () => {
  // dprint-ignore
  Test.describe('placement without newlines')
    .i<{ placement: 'before' | 'after' | 'over' }>()
    .o<string>()
    .cases(
      ['before placement', [{ placement: 'before' as const }], 'New content'],
      ['after placement',  [{ placement: 'after' as const }],  'New content'],
      ['over placement',   [{ placement: 'over' as const }],   'New content'],
    )
    .test((i, o) => {
      const type = { description: undefined } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on,
        content: 'New content',
        placement: i.placement,
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe(o)
    })

  // dprint-ignore
  Test.describe('empty string handling')
    .i<{ placement: 'before' | 'after' | 'over' }>()
    .o<string>()
    .cases(
      ['before placement', [{ placement: 'before' as const }], 'New content'],
      ['after placement',  [{ placement: 'after' as const }],  'New content'],
      ['over placement',   [{ placement: 'over' as const }],   'New content'],
    )
    .test((i, o) => {
      const type = { description: '' } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on,
        content: 'New content',
        placement: i.placement,
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe(o)
    })
})

describe('with existing description', () => {
  // dprint-ignore
  Test.describe('content combination')
    .i<{ placement: 'before' | 'after' | 'over' }>()
    .o<string>()
    .cases(
      ['before placement', [{ placement: 'before' as const }], 'New content\n\nExisting description'],
      ['after placement',  [{ placement: 'after' as const }],  'Existing description\n\nNew content'],
      ['over placement',   [{ placement: 'over' as const }],   'New content'],
    )
    .test((i, o) => {
      const type = { description: 'Existing description' } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on,
        content: 'New content',
        placement: i.placement,
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe(o)
    })
})

describe('edge cases', () => {
  test('handles whitespace-only existing description as empty', () => {
    const type = { description: '   \n  \t  ' } as GrafaidOld.Groups.Describable
    const augmentation: AugmentationConfig = {
      on,
      content: 'New content',
      placement: 'before',
    }

    mutateDescription(type, augmentation)

    expect(type.description).toBe('New content')
  })

  test('preserves meaningful whitespace in existing description', () => {
    const type = { description: '  Indented content  ' } as GrafaidOld.Groups.Describable
    const augmentation: AugmentationConfig = {
      on,
      content: 'New content',
      placement: 'before',
    }

    mutateDescription(type, augmentation)

    expect(type.description).toBe('New content\n\nIndented content')
  })
})
