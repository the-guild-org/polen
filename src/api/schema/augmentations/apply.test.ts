import { Test } from '@wollybeard/kit/test'
import { GrafaidOld, GraphQLSchemaPath } from 'graphql-kit'
import { describe, expect, test } from 'vitest'
import { mutateDescription } from './apply.js'
import type { AugmentationConfig } from './config.js'

const on = GraphQLSchemaPath.Nodes.Root.make()

describe('with empty existing description', () => {
  type PlacementInput = { placement: 'before' | 'after' | 'over' }
  type PlacementOutput = { expected: string }

  // dprint-ignore
  Test.Table.suite<PlacementInput, PlacementOutput>('placement without newlines', [
      { n: 'before placement', i: { placement: 'before' as const }, o: { expected: 'New content' } },
      { n: 'after placement',  i: { placement: 'after' as const },  o: { expected: 'New content' } },
      { n: 'over placement',   i: { placement: 'over' as const },   o: { expected: 'New content' } },
    ], ({ i, o }) => {
      const type = { description: undefined } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on,
        content: 'New content',
        placement: i.placement,
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe(o.expected)
    })

  // dprint-ignore
  Test.Table.suite<PlacementInput, PlacementOutput>('empty string handling', [
      { n: 'before placement', i: { placement: 'before' as const }, o: { expected: 'New content' } },
      { n: 'after placement',  i: { placement: 'after' as const },  o: { expected: 'New content' } },
      { n: 'over placement',   i: { placement: 'over' as const },   o: { expected: 'New content' } },
    ], ({ i, o }) => {
      const type = { description: '' } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on,
        content: 'New content',
        placement: i.placement,
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe(o.expected)
    })
})

describe('with existing description', () => {
  type ContentInput = { placement: 'before' | 'after' | 'over' }
  type ContentOutput = { expected: string }

  // dprint-ignore
  Test.Table.suite<ContentInput, ContentOutput>('content combination', [
      { n: 'before placement', i: { placement: 'before' as const }, o: { expected: 'New content\n\nExisting description' } },
      { n: 'after placement',  i: { placement: 'after' as const },  o: { expected: 'Existing description\n\nNew content' } },
      { n: 'over placement',   i: { placement: 'over' as const },   o: { expected: 'New content' } },
    ], ({ i, o }) => {
      const type = { description: 'Existing description' } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on,
        content: 'New content',
        placement: i.placement,
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe(o.expected)
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
