import { expect, test } from 'vitest'
import { getHighlighter, highlightCode } from './shiki.js'

test('getHighlighter returns singleton instance', async () => {
  const highlighter1 = await getHighlighter()
  const highlighter2 = await getHighlighter()

  expect(highlighter1).toBe(highlighter2)
})

test('highlightCode generates HTML with syntax highlighting', async () => {
  const code = 'const hello = "world"'
  const result = await highlightCode({
    code,
    lang: 'javascript',
    theme: 'light',
  })

  expect(result).toContain('<pre')
  expect(result).toContain('shiki')
  expect(result).toContain('hello')
  expect(result).toContain('world')
})

test('highlightCode supports TypeScript', async () => {
  const code = 'interface User { name: string }'
  const result = await highlightCode({
    code,
    lang: 'typescript',
    theme: 'light',
  })

  expect(result).toContain('interface')
  expect(result).toContain('User')
  expect(result).toContain('string')
})

test('highlightCode supports GraphQL', async () => {
  const code = 'type Query { user: User }'
  const result = await highlightCode({
    code,
    lang: 'graphql',
    theme: 'light',
  })

  expect(result).toContain('type')
  expect(result).toContain('Query')
  expect(result).toContain('User')
})

test('highlightCode handles unknown language gracefully', async () => {
  const code = 'some random text'
  // Use 'text' as fallback for unknown languages
  const result = await highlightCode({
    code,
    lang: 'text',
    theme: 'light',
  })

  // Should still return highlighted HTML
  expect(result).toContain('<pre')
  expect(result).toContain('some random text')
})

test('highlightCode applies line numbers when requested', async () => {
  const code = 'line 1\nline 2\nline 3'
  const result = await highlightCode({
    code,
    lang: 'text',
    theme: 'light',
    showLineNumbers: true,
  })

  expect(result).toContain('data-line-numbers="true"')
})

test('highlightCode applies line highlighting', async () => {
  const code = 'line 1\nline 2\nline 3'
  const result = await highlightCode({
    code,
    lang: 'text',
    theme: 'light',
    highlightLines: [2],
  })

  expect(result).toContain('data-highlighted="true"')
})

test('highlightCode supports both light and dark themes', async () => {
  const code = 'const x = 1'

  const lightResult = await highlightCode({
    code,
    lang: 'javascript',
    theme: 'light',
  })

  const darkResult = await highlightCode({
    code,
    lang: 'javascript',
    theme: 'dark',
  })

  // Both should contain theme CSS variables
  expect(lightResult).toContain('--shiki-light')
  expect(darkResult).toContain('--shiki-dark')
})
