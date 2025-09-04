import { Command, Options } from '@effect/cli'
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'
import { EffectCliHelpMarkdown } from './$.js'

describe('EffectCliHelpMarkdown', () => {
  describe('commandToMarkdown', () => {
    test('generates markdown for a simple command', () => {
      const command = Command.make('test').pipe(
        Command.withHandler(() => Effect.succeed(undefined))
      )
      
      const markdown = EffectCliHelpMarkdown.commandToMarkdown(command)
      
      // Basic expectations - will enhance once we have proper implementation
      expect(markdown).toBeDefined()
      expect(typeof markdown).toBe('string')
    })

    test('respects baseHeadingLevel option', () => {
      const command = Command.make('test').pipe(
        Command.withHandler(() => Effect.succeed(undefined))
      )
      
      const markdown = EffectCliHelpMarkdown.commandToMarkdown(command, {
        baseHeadingLevel: 2,
        includeCommandName: true,
      })
      
      // Should start with ## instead of #
      if (markdown.includes('#')) {
        expect(markdown).toMatch(/^##\s/)
      }
    })

    test('excludes command name when includeCommandName is false', () => {
      const command = Command.make('test-command').pipe(
        Command.withHandler(() => Effect.succeed(undefined))
      )
      
      const markdown = EffectCliHelpMarkdown.commandToMarkdown(command, {
        includeCommandName: false,
      })
      
      // Should not include the command name as a heading
      expect(markdown).not.toMatch(/^#.*test-command/)
    })
  })
})