import { Test } from '@wollybeard/kit/test'
import { GrafaidOld } from 'graphql-kit'
import { describe, expect, test } from 'vitest'
import { mutateDescription } from './apply.js'
import type { AugmentationConfig } from './config.js'

describe('mutateDescription', () => {
  describe('with empty existing description', () => {
    // dprint-ignore
    Test.Table.suite<{ placement: 'before' | 'after' | 'over'; expected: string }>('placement without newlines', [
      { name: 'before placement', placement: 'before' as const, expected: 'New content' },
      { name: 'after placement',  placement: 'after' as const,  expected: 'New content' },
      { name: 'over placement',   placement: 'over' as const,   expected: 'New content' },
    ], ({ placement, expected }) => {
      const type = { description: undefined } as GrafaidOld.Groups.Describable
      const augmentation: AugmentationConfig = {
        on: {} as any, // Not used by mutateDescription
        content: 'New content',
        placement,
      }

      mutateDescription(type, augmentation)

      expect(type.description).toBe(expected)
    })

    // dprint-ignore
    Test.Table.suite<{ placement: 'before' | 'after' | 'over'; expected: string }>('empty string handling', [
      { name: 'before placement', placement: 'before' as const, expected: 'New content' },
      { name: 'after placement',  placement: 'after' as const,  expected: 'New content' },
      { name: 'over placement',   placement: 'over' as const,   expected: 'New content' },
    ], ({ placement, expected }) => {
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
    // dprint-ignore
    Test.Table.suite<{ placement: 'before' | 'after' | 'over'; expected: string }>('content combination', [
      { name: 'before placement', placement: 'before' as const, expected: 'New content\n\nExisting description' },
      { name: 'after placement',  placement: 'after' as const,  expected: 'Existing description\n\nNew content' },
      { name: 'over placement',   placement: 'over' as const,   expected: 'New content' },
    ], ({ placement, expected }) => {
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
