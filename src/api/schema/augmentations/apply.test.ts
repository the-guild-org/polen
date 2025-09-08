import type { GrafaidOld } from '#lib/grafaid-old'
import { describe, expect, test } from 'vitest'
import { mutateDescription } from './apply.js'
import type { AugmentationConfig } from './config.js'

describe('mutateDescription', () => {
  describe('with empty existing description', () => {
    test.for([
      { placement: 'before' as const, expected: 'New content' },
      { placement: 'after' as const, expected: 'New content' },
      { placement: 'over' as const, expected: 'New content' },
    ])('$placement placement does not add extra newlines', ({ placement, expected }) => {
      const type = { description: undefined } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on: {} as any, // Not used by mutateDescription
        content: 'New content',
        placement,
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe(expected)
    })

    test.for([
      { placement: 'before' as const, expected: 'New content' },
      { placement: 'after' as const, expected: 'New content' },
      { placement: 'over' as const, expected: 'New content' },
    ])('$placement placement handles empty string description', ({ placement, expected }) => {
      const type = { description: '' } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on: {} as any,
        content: 'New content',
        placement,
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe(expected)
    })
  })

  describe('with existing description', () => {
    test.for([
      { placement: 'before' as const, expected: 'New content\n\nExisting description' },
      { placement: 'after' as const, expected: 'Existing description\n\nNew content' },
      { placement: 'over' as const, expected: 'New content' },
    ])('$placement placement correctly combines content', ({ placement, expected }) => {
      const type = { description: 'Existing description' } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on: {} as any,
        content: 'New content',
        placement,
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe(expected)
    })
  })

  describe('edge cases', () => {
    test('handles whitespace-only existing description as empty', () => {
      const type = { description: '   \n  \t  ' } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on: {} as any,
        content: 'New content',
        placement: 'before',
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe('New content')
    })

    test('preserves meaningful whitespace in existing description', () => {
      const type = { description: '  Indented content  ' } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on: {} as any,
        content: 'New content',
        placement: 'before',
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe('New content\n\nIndented content')
    })
  })
})
